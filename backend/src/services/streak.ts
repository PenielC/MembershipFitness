const DAY_MS = 86_400_000;

/** Calendar day (UTC) as a whole number of days since the epoch. */
export function utcDayNumber(d: Date): number {
  return Math.floor(d.getTime() / DAY_MS);
}

/**
 * Current streak: consecutive UTC calendar days with at least one visit.
 *
 * - Several visits on one day count once.
 * - If there is no visit yet today, the streak is still alive as long as there was one yesterday
 *   (the member still has today to extend it). Two or more days without a visit breaks it.
 */
export function calculateStreak(visits: readonly Date[], now: Date): number {
  const days = new Set(visits.filter((v) => v.getTime() <= now.getTime()).map(utcDayNumber));
  const today = utcDayNumber(now);
  let cursor = days.has(today) ? today : today - 1;
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor--;
  }
  return streak;
}
