import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

/** There is no login in this case study: the app always acts as this seeded member. */
export const CURRENT_MEMBER_ID = 'member-1';

export const keys = {
  member: ['member', CURRENT_MEMBER_ID] as const,
  stats: ['stats', CURRENT_MEMBER_ID] as const,
  bookings: ['bookings', CURRENT_MEMBER_ID] as const,
  gyms: ['gyms'] as const,
  classes: (gymId: string) => ['classes', gymId] as const,
};

export const useMember = () => useQuery({ queryKey: keys.member, queryFn: () => api.getMember(CURRENT_MEMBER_ID) });
export const useStats = () => useQuery({ queryKey: keys.stats, queryFn: () => api.getStats(CURRENT_MEMBER_ID) });
export const useBookings = () => useQuery({ queryKey: keys.bookings, queryFn: () => api.getBookings(CURRENT_MEMBER_ID) });
export const useGyms = () => useQuery({ queryKey: keys.gyms, queryFn: () => api.getGyms() });
export const useClasses = (gymId: string | undefined) =>
  useQuery({ queryKey: keys.classes(gymId ?? ''), queryFn: () => api.getClasses(gymId ?? ''), enabled: gymId !== undefined });

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gymId: string) => api.checkIn(CURRENT_MEMBER_ID, gymId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.stats }),
  });
}

export function useBookClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => api.bookClass(classId, CURRENT_MEMBER_ID),
    // Refresh on success *and* failure: a "full" or "already booked" error means our view was stale.
    onSettled: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['classes'] }),
        qc.invalidateQueries({ queryKey: keys.bookings }),
        qc.invalidateQueries({ queryKey: keys.stats }),
      ]);
    },
  });
}
