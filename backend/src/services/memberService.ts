import type { Clock, Gym, Member, NotificationSettings, Store } from '../types.js';
import { requireGym, requireMember } from './lookup.js';
import { calculateStreak } from './streak.js';

export interface MemberProfile extends Member {
  homeGym: Gym;
  preferredGym: Gym;
}

export interface MemberStats {
  totalVisits: number;
  visitsThisMonth: number;
  currentStreak: number;
  favoriteGym: Gym | null;
  classesAttended: number;
  upcomingBookings: number;
}

export interface PreferencesInput {
  preferredGymId?: string | undefined;
  notifications?: NotificationSettings | undefined;
}

export function createMemberService(store: Store, clock: Clock) {
  const profile = (m: Member): MemberProfile => ({
    ...m,
    homeGym: requireGym(store, m.homeGymId),
    preferredGym: requireGym(store, m.preferredGymId),
  });

  return {
    get(id: string): MemberProfile {
      return profile(requireMember(store, id));
    },

    stats(id: string): MemberStats {
      const member = requireMember(store, id);
      const now = clock();
      const visits = store.checkIns.filter((c) => c.memberId === id && c.at.getTime() <= now.getTime());

      // Favorite gym = most visited; ties go to the home gym, then to the lowest gym id.
      const perGym = new Map<string, number>();
      for (const v of visits) perGym.set(v.gymId, (perGym.get(v.gymId) ?? 0) + 1);
      const ranked = [...perGym.entries()].sort(
        ([idA, a], [idB, b]) => b - a || Number(idB === member.homeGymId) - Number(idA === member.homeGymId) || idA.localeCompare(idB),
      );
      const favoriteId = ranked[0]?.[0];

      const bookedClasses = store.bookings
        .filter((b) => b.memberId === id)
        .map((b) => store.classes.get(b.classId))
        .filter((c): c is NonNullable<typeof c> => c !== undefined);

      return {
        totalVisits: visits.length,
        visitsThisMonth: visits.filter((v) => v.at.getUTCFullYear() === now.getUTCFullYear() && v.at.getUTCMonth() === now.getUTCMonth()).length,
        currentStreak: calculateStreak(visits.map((v) => v.at), now),
        favoriteGym: favoriteId ? requireGym(store, favoriteId) : null,
        classesAttended: bookedClasses.filter((c) => c.startsAt.getTime() <= now.getTime()).length,
        upcomingBookings: bookedClasses.filter((c) => c.startsAt.getTime() > now.getTime()).length,
      };
    },

    updatePreferences(id: string, input: PreferencesInput): MemberProfile {
      const member = requireMember(store, id);
      if (input.preferredGymId !== undefined) requireGym(store, input.preferredGymId);
      if (input.preferredGymId !== undefined) member.preferredGymId = input.preferredGymId;
      if (input.notifications) member.notifications = { ...input.notifications };
      return profile(member);
    },
  };
}

export type MemberService = ReturnType<typeof createMemberService>;
