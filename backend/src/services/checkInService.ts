import { ConflictError } from '../errors.js';
import type { CheckIn, Clock, Store } from '../types.js';
import { requireGym, requireMember } from './lookup.js';
import { calculateStreak } from './streak.js';

export const DUPLICATE_WINDOW_MS = 3_600_000; // 1 hour
export const HISTORY_DAYS = 30;

export interface CheckInHistory {
  checkIns: CheckIn[];
  streak: number;
}

export function createCheckInService(store: Store, clock: Clock) {
  const visitsOf = (memberId: string): CheckIn[] => store.checkIns.filter((c) => c.memberId === memberId);

  return {
    checkIn(memberId: string, gymId: string): { checkIn: CheckIn; streak: number } {
      requireMember(store, memberId);
      requireGym(store, gymId);
      const now = clock();
      const recent = visitsOf(memberId).find((c) => now.getTime() - c.at.getTime() < DUPLICATE_WINDOW_MS);
      if (recent) {
        const minutes = Math.max(1, Math.ceil((recent.at.getTime() + DUPLICATE_WINDOW_MS - now.getTime()) / 60_000));
        throw new ConflictError('DUPLICATE_CHECK_IN', `You already checked in within the last hour. You can check in again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
      }
      const checkIn: CheckIn = { id: `checkin-${store.checkIns.length + 1}`, memberId, gymId, at: now };
      store.checkIns.push(checkIn);
      return { checkIn, streak: calculateStreak(visitsOf(memberId).map((c) => c.at), now) };
    },

    history(memberId: string): CheckInHistory {
      requireMember(store, memberId);
      const now = clock();
      const since = now.getTime() - HISTORY_DAYS * 86_400_000;
      const all = visitsOf(memberId);
      return {
        checkIns: all.filter((c) => c.at.getTime() >= since).sort((a, b) => b.at.getTime() - a.at.getTime()),
        streak: calculateStreak(all.map((c) => c.at), now),
      };
    },
  };
}

export type CheckInService = ReturnType<typeof createCheckInService>;
