import { ConflictError, BadRequestError, NotFoundError } from '../errors.js';
import type { Booking, Clock, ClassType, Gym, GymClass, Store } from '../types.js';
import { requireClass, requireGym, requireMember } from './lookup.js';

export interface ClassView extends GymClass {
  booked: number;
  spotsLeft: number;
  isFull: boolean;
}

export interface BookingView {
  booking: Booking;
  class: ClassView;
}

export interface ClassFilter {
  /** YYYY-MM-DD, matched against the class start date in UTC. */
  date?: string | undefined;
  type?: ClassType | undefined;
}

export function createClassService(store: Store, clock: Clock) {
  const bookedCount = (classId: string): number => store.bookings.filter((b) => b.classId === classId).length;

  const toView = (c: GymClass): ClassView => {
    const booked = bookedCount(c.id);
    return { ...c, booked, spotsLeft: Math.max(0, c.capacity - booked), isFull: booked >= c.capacity };
  };

  return {
    listGyms(): Gym[] {
      return [...store.gyms.values()];
    },

    listForGym(gymId: string, filter: ClassFilter): ClassView[] {
      requireGym(store, gymId);
      return [...store.classes.values()]
        .filter((c) => c.gymId === gymId)
        .filter((c) => !filter.type || c.type === filter.type)
        .filter((c) => !filter.date || c.startsAt.toISOString().slice(0, 10) === filter.date)
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
        .map(toView);
    },

    book(classId: string, memberId: string): BookingView {
      const gymClass = requireClass(store, classId);
      requireMember(store, memberId);
      const now = clock();
      if (gymClass.startsAt.getTime() <= now.getTime()) {
        throw new BadRequestError('CLASS_IN_PAST', 'This class has already started and can no longer be booked');
      }
      if (store.bookings.some((b) => b.classId === classId && b.memberId === memberId)) {
        throw new ConflictError('ALREADY_BOOKED', 'You have already booked this class');
      }
      if (bookedCount(classId) >= gymClass.capacity) {
        throw new ConflictError('CLASS_FULL', 'This class is full');
      }
      const booking: Booking = { classId, memberId, bookedAt: now };
      store.bookings.push(booking);
      return { booking, class: toView(gymClass) };
    },

    cancel(classId: string, memberId: string): void {
      const gymClass = requireClass(store, classId);
      requireMember(store, memberId);
      const index = store.bookings.findIndex((b) => b.classId === classId && b.memberId === memberId);
      if (index === -1) throw new NotFoundError('No booking found for this member and class');
      if (gymClass.startsAt.getTime() <= clock().getTime()) {
        throw new BadRequestError('CLASS_IN_PAST', 'This class has already started and can no longer be cancelled');
      }
      store.bookings.splice(index, 1);
    },

    upcomingBookings(memberId: string): BookingView[] {
      requireMember(store, memberId);
      const now = clock().getTime();
      return store.bookings
        .filter((b) => b.memberId === memberId)
        .flatMap((booking) => {
          const gymClass = store.classes.get(booking.classId);
          return gymClass && gymClass.startsAt.getTime() > now ? [{ booking, class: toView(gymClass) }] : [];
        })
        .sort((a, b) => a.class.startsAt.getTime() - b.class.startsAt.getTime());
    },
  };
}

export type ClassService = ReturnType<typeof createClassService>;
