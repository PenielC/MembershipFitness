// Mirrors the backend JSON responses (dates arrive as ISO strings).

export type MembershipTier = 'basic' | 'premium' | 'elite';
export type ClassType = 'yoga' | 'hiit' | 'spin';

export interface Gym {
  id: string;
  name: string;
  city: string;
}

export interface MemberProfile {
  id: string;
  name: string;
  email: string;
  tier: MembershipTier;
  homeGymId: string;
  preferredGymId: string;
  joinedAt: string;
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

export interface GymClass {
  id: string;
  gymId: string;
  name: string;
  instructor: string;
  type: ClassType;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  booked: number;
  spotsLeft: number;
  isFull: boolean;
}

export interface BookingView {
  booking: { classId: string; memberId: string; bookedAt: string };
  class: GymClass;
}

export interface CheckInResult {
  checkIn: { id: string; memberId: string; gymId: string; at: string };
  streak: number;
}
