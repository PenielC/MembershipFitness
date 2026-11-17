import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { createSeededStore } from '../src/store/seed.js';
import { calculateStreak } from '../src/services/streak.js';

// Fixed "now" at midday UTC so seeded relative times are deterministic.
const NOW = new Date('2026-03-18T12:00:00Z');
const d = (iso: string): Date => new Date(iso);

function setup(now: Date = NOW) {
  let current = now;
  const store = createSeededStore(now);
  const app = buildApp({ store, clock: () => current });
  return { app, store, advance: (ms: number) => (current = new Date(current.getTime() + ms)) };
}

describe('calculateStreak (service)', () => {
  it('counts consecutive days and counts several visits in a day once', () => {
    const visits = [d('2026-03-18T08:00:00Z'), d('2026-03-18T09:00:00Z'), d('2026-03-17T20:00:00Z'), d('2026-03-16T06:00:00Z')];
    expect(calculateStreak(visits, NOW)).toBe(3);
  });

  it('stays alive when today has no visit yet but yesterday does', () => {
    expect(calculateStreak([d('2026-03-17T10:00:00Z'), d('2026-03-16T10:00:00Z')], NOW)).toBe(2);
  });

  it('breaks after a missed day and is 0 with no visits', () => {
    expect(calculateStreak([d('2026-03-16T10:00:00Z')], NOW)).toBe(0);
    expect(calculateStreak([], NOW)).toBe(0);
  });

  it('only counts the run ending now, not older runs', () => {
    expect(calculateStreak([d('2026-03-18T01:00:00Z'), d('2026-03-15T01:00:00Z'), d('2026-03-14T01:00:00Z')], NOW)).toBe(1);
  });
});

describe('members API', () => {
  it('returns a profile and 404 for an unknown member', async () => {
    const { app } = setup();
    const ok = await app.inject({ method: 'GET', url: '/api/members/member-1' });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({ name: 'Alex Johnson', tier: 'premium', homeGym: { id: 'gym-1' } });

    const missing = await app.inject({ method: 'GET', url: '/api/members/nope' });
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toEqual({ error: { code: 'NOT_FOUND', message: "Member 'nope' not found" } });
  });

  it('returns stats including the streak', async () => {
    const { app } = setup();
    const res = await app.inject({ method: 'GET', url: '/api/members/member-1/stats' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ currentStreak: 5, totalVisits: 7, classesAttended: 1, upcomingBookings: 1, favoriteGym: { id: 'gym-1' } });
  });

  it('updates preferences and rejects bad input', async () => {
    const { app } = setup();
    const ok = await app.inject({
      method: 'PUT',
      url: '/api/members/member-1/preferences',
      payload: { preferredGymId: 'gym-2', notifications: { classReminders: false, streakAlerts: true } },
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({ preferredGymId: 'gym-2', notifications: { classReminders: false, streakAlerts: true } });

    const badShape = await app.inject({ method: 'PUT', url: '/api/members/member-1/preferences', payload: { notifications: { classReminders: 'yes' } } });
    expect(badShape.statusCode).toBe(400);
    expect(badShape.json().error.code).toBe('VALIDATION_ERROR');

    const empty = await app.inject({ method: 'PUT', url: '/api/members/member-1/preferences', payload: {} });
    expect(empty.statusCode).toBe(400);

    const unknownGym = await app.inject({ method: 'PUT', url: '/api/members/member-1/preferences', payload: { preferredGymId: 'gym-99' } });
    expect(unknownGym.statusCode).toBe(404);
  });
});

describe('classes API', () => {
  it('lists classes for a gym, filtered by type and date', async () => {
    const { app } = setup();
    expect((await app.inject({ method: 'GET', url: '/api/gyms' })).json().gyms).toHaveLength(3);
    const all = await app.inject({ method: 'GET', url: '/api/gyms/gym-1/classes' });
    expect(all.json().classes).toHaveLength(4);

    const spin = await app.inject({ method: 'GET', url: '/api/gyms/gym-1/classes?type=spin' });
    expect(spin.json().classes.map((c: { name: string }) => c.name)).toEqual(['Spin Express']);

    const byDate = await app.inject({ method: 'GET', url: '/api/gyms/gym-1/classes?date=2026-03-19' });
    expect(byDate.json().classes.length).toBeGreaterThan(0);

    expect((await app.inject({ method: 'GET', url: '/api/gyms/gym-1/classes?type=boxing' })).statusCode).toBe(400);
    expect((await app.inject({ method: 'GET', url: '/api/gyms/gym-1/classes?date=2026-13-45' })).statusCode).toBe(400);
    expect((await app.inject({ method: 'GET', url: '/api/gyms/gym-9/classes' })).statusCode).toBe(404);
  });

  it('books, blocks duplicates (409), blocks full classes (409), and cancels', async () => {
    const { app } = setup();
    const book = (classId: string, memberId: string) => app.inject({ method: 'POST', url: `/api/classes/${classId}/book`, payload: { memberId } });

    const first = await book('class-4', 'member-3');
    expect(first.statusCode).toBe(201);
    expect(first.json().class).toMatchObject({ booked: 1, spotsLeft: 19 });

    const dup = await book('class-4', 'member-3');
    expect(dup.statusCode).toBe(409);
    expect(dup.json().error.code).toBe('ALREADY_BOOKED');

    const full = await book('class-3', 'member-4');
    expect(full.statusCode).toBe(409);
    expect(full.json().error.code).toBe('CLASS_FULL');

    const past = await book('class-1', 'member-4');
    expect(past.statusCode).toBe(400);
    expect(past.json().error.code).toBe('CLASS_IN_PAST');

    expect((await book('class-4', '')).statusCode).toBe(400);
    expect((await book('class-99', 'member-1')).statusCode).toBe(404);

    const cancel = await app.inject({ method: 'DELETE', url: '/api/classes/class-4/book/member-3' });
    expect(cancel.statusCode).toBe(204);
    const again = await app.inject({ method: 'DELETE', url: '/api/classes/class-4/book/member-3' });
    expect(again.statusCode).toBe(404);

    // Cancelling frees the spot in a full class.
    await app.inject({ method: 'DELETE', url: '/api/classes/class-3/book/member-2' });
    expect((await book('class-3', 'member-4')).statusCode).toBe(201);
  });

  it('lists only upcoming bookings, soonest first', async () => {
    const { app } = setup();
    const res = await app.inject({ method: 'GET', url: '/api/members/member-1/bookings' });
    expect(res.statusCode).toBe(200);
    expect(res.json().bookings.map((b: { class: { id: string } }) => b.class.id)).toEqual(['class-2']);
  });
});

describe('check-ins API', () => {
  it('rejects a duplicate check-in within one hour, allows it after', async () => {
    const { app, advance } = setup();
    const post = () => app.inject({ method: 'POST', url: '/api/check-in', payload: { memberId: 'member-5', gymId: 'gym-2' } });

    const first = await post();
    expect(first.statusCode).toBe(201);
    expect(first.json().streak).toBe(1);

    advance(59 * 60_000);
    const dup = await post();
    expect(dup.statusCode).toBe(409);
    expect(dup.json().error.code).toBe('DUPLICATE_CHECK_IN');

    advance(2 * 60_000);
    expect((await post()).statusCode).toBe(201);
  });

  it('validates input and returns history with streak', async () => {
    const { app } = setup();
    expect((await app.inject({ method: 'POST', url: '/api/check-in', payload: { memberId: 'member-1' } })).statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/api/check-in', payload: { memberId: 'member-1', gymId: 'gym-9' } })).statusCode).toBe(404);

    const history = await app.inject({ method: 'GET', url: '/api/members/member-1/check-ins' });
    expect(history.statusCode).toBe(200);
    const body = history.json();
    expect(body.streak).toBe(5);
    expect(body.checkIns).toHaveLength(7);
    expect(body.checkIns[0].at > body.checkIns[1].at).toBe(true);
  });

  it('returns a consistent error for malformed JSON and unknown routes', async () => {
    const { app } = setup();
    const bad = await app.inject({ method: 'POST', url: '/api/check-in', headers: { 'content-type': 'application/json' }, payload: '{oops' });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error.code).toBe('BAD_REQUEST');
    expect((await app.inject({ method: 'GET', url: '/api/nothing' })).statusCode).toBe(404);
  });
});
