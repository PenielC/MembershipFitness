import { NotFoundError } from '../errors.js';
import type { GymClass, Gym, Member, Store } from '../types.js';

export function requireMember(store: Store, id: string): Member {
  const member = store.members.get(id);
  if (!member) throw new NotFoundError(`Member '${id}' not found`);
  return member;
}

export function requireGym(store: Store, id: string): Gym {
  const gym = store.gyms.get(id);
  if (!gym) throw new NotFoundError(`Gym '${id}' not found`);
  return gym;
}

export function requireClass(store: Store, id: string): GymClass {
  const gymClass = store.classes.get(id);
  if (!gymClass) throw new NotFoundError(`Class '${id}' not found`);
  return gymClass;
}
