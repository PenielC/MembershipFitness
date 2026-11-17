import type { ClassType, Store } from '../types.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Midnight UTC of the day containing `d`. */
function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Builds a pre-seeded store: 3 gyms, 5 members, 10 classes.
 * Class and check-in times are relative to `now` so the demo always has bookable classes and a live streak.
 */
export function createSeededStore(now: Date): Store {
  const store: Store = {
    gyms: new Map(),
    members: new Map(),
    classes: new Map(),
    bookings: [],
    checkIns: [],
  };

  for (const g of [
    { id: 'gym-1', name: 'Downtown Fitness', city: 'Chicago' },
    { id: 'gym-2', name: 'Riverside Club', city: 'Chicago' },
    { id: 'gym-3', name: 'Lakeview Studio', city: 'Evanston' },
  ]) {
    store.gyms.set(g.id, g);
  }

  const members = [
    { id: 'member-1', name: 'Alex Johnson', email: 'alex@example.com', tier: 'premium', homeGymId: 'gym-1', joinedAt: '2023-03-14' },
    { id: 'member-2', name: 'Priya Patel', email: 'priya@example.com', tier: 'elite', homeGymId: 'gym-2', joinedAt: '2022-11-02' },
    { id: 'member-3', name: 'Sam Rivera', email: 'sam@example.com', tier: 'basic', homeGymId: 'gym-1', joinedAt: '2024-01-20' },
    { id: 'member-4', name: 'Jordan Lee', email: 'jordan@example.com', tier: 'premium', homeGymId: 'gym-3', joinedAt: '2023-08-09' },
    { id: 'member-5', name: 'Taylor Brooks', email: 'taylor@example.com', tier: 'basic', homeGymId: 'gym-2', joinedAt: '2024-06-30' },
  ] as const;
  for (const m of members) {
    store.members.set(m.id, {
      ...m,
      preferredGymId: m.homeGymId,
      joinedAt: new Date(m.joinedAt),
      notifications: { classReminders: true, streakAlerts: true },
    });
  }

  // [gymId, name, instructor, type, hours from now (negative = past), capacity]
  const classes: Array<[string, string, string, ClassType, number, number]> = [
    ['gym-1', 'Sunrise Yoga', 'Maya Chen', 'yoga', -30, 20],
    ['gym-1', 'HIIT Blast', 'Marcus Reed', 'hiit', 20, 12],
    ['gym-1', 'Spin Express', 'Dana Ortiz', 'spin', 26, 2],
    ['gym-1', 'Evening Flow', 'Maya Chen', 'yoga', 52, 20],
    ['gym-2', 'Power Spin', 'Dana Ortiz', 'spin', 22, 15],
    ['gym-2', 'Core HIIT', 'Marcus Reed', 'hiit', 30, 10],
    ['gym-2', 'Restorative Yoga', 'Lena Park', 'yoga', 75, 18],
    ['gym-3', 'Lakeside Yoga', 'Lena Park', 'yoga', 28, 16],
    ['gym-3', 'Tabata Time', 'Noah Kim', 'hiit', 50, 14],
    ['gym-3', 'Endurance Spin', 'Noah Kim', 'spin', 98, 20],
  ];
  classes.forEach(([gymId, name, instructor, type, hours, capacity], i) => {
    store.classes.set(`class-${i + 1}`, {
      id: `class-${i + 1}`,
      gymId,
      name,
      instructor,
      type,
      startsAt: new Date(now.getTime() + hours * HOUR),
      durationMinutes: 45,
      capacity,
    });
  });

  store.bookings.push(
    // Alex attended a past class and is booked on a future one.
    { classId: 'class-1', memberId: 'member-1', bookedAt: new Date(now.getTime() - 60 * HOUR) },
    { classId: 'class-2', memberId: 'member-1', bookedAt: new Date(now.getTime() - 2 * HOUR) },
    // class-3 has capacity 2 and is already full.
    { classId: 'class-3', memberId: 'member-2', bookedAt: new Date(now.getTime() - 3 * HOUR) },
    { classId: 'class-3', memberId: 'member-3', bookedAt: new Date(now.getTime() - 3 * HOUR) },
  );

  // Alex: a 5-day streak ending today. Priya: a streak that ended two days ago (so it is broken).
  const today = startOfUtcDay(now);
  let id = 1;
  const visit = (memberId: string, gymId: string, daysAgo: number, hour: number): void => {
    const at = new Date(today - daysAgo * DAY + hour * HOUR);
    if (at.getTime() <= now.getTime()) store.checkIns.push({ id: `checkin-${id++}`, memberId, gymId, at });
  };
  for (let d = 0; d < 5; d++) visit('member-1', 'gym-1', d, 0.1);
  visit('member-1', 'gym-2', 9, 18);
  visit('member-1', 'gym-1', 12, 18);
  for (const d of [2, 3, 4, 5]) visit('member-2', 'gym-2', d, 6);
  for (const d of [1, 8, 15]) visit('member-3', 'gym-1', d, 17);
  visit('member-4', 'gym-3', 0, 0.05);

  return store;
}
