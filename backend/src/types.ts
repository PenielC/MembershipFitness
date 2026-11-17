export type MembershipTier = 'basic' | 'premium' | 'elite';
export type ClassType = 'yoga' | 'hiit' | 'spin';

export interface NotificationSettings {
  classReminders: boolean;
  streakAlerts: boolean;
}

export interface Gym {
  id: string;
  name: string;
  city: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  tier: MembershipTier;
  homeGymId: string;
  preferredGymId: string;
  joinedAt: Date;
  notifications: NotificationSettings;
}

export interface GymClass {
  id: string;
  gymId: string;
  name: string;
  instructor: string;
  type: ClassType;
  startsAt: Date;
  durationMinutes: number;
  capacity: number;
}

export interface Booking {
  classId: string;
  memberId: string;
  bookedAt: Date;
}

export interface CheckIn {
  id: string;
  memberId: string;
  gymId: string;
  at: Date;
}

/** Source of "now". Injected so date-dependent logic is testable. */
export type Clock = () => Date;

export interface Store {
  gyms: Map<string, Gym>;
  members: Map<string, Member>;
  classes: Map<string, GymClass>;
  bookings: Booking[];
  checkIns: CheckIn[];
}
