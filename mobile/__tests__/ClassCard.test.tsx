import { fireEvent, render, screen } from '@testing-library/react-native';
import { ClassCard } from '../src/components/ClassCard';
import type { GymClass } from '../src/api/types';
import { groupByDay, upcomingOnly } from '../src/screens/ClassBookingScreen';

const base: GymClass = {
  id: 'class-1',
  gymId: 'gym-1',
  name: 'HIIT Blast',
  instructor: 'Marcus Reed',
  type: 'hiit',
  startsAt: '2030-01-15T10:00:00.000Z',
  durationMinutes: 45,
  capacity: 20,
  booked: 12,
  spotsLeft: 8,
  isFull: false,
};

describe('ClassCard', () => {
  it('shows capacity and type, and books on press', async () => {
    const onBook = jest.fn();
    await render(<ClassCard gymClass={base} alreadyBooked={false} busy={false} onBook={onBook} />);
    expect(screen.getByText('12/20 spots')).toBeTruthy();
    expect(screen.getByText('HIIT')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Book HIIT Blast/ }));
    expect(onBook).toHaveBeenCalledWith('class-1');
  });

  it('disables the button when the class is full', async () => {
    const onBook = jest.fn();
    await render(<ClassCard gymClass={{ ...base, booked: 20, spotsLeft: 0, isFull: true }} alreadyBooked={false} busy={false} onBook={onBook} />);
    const button = screen.getByRole('button', { name: /Full HIIT Blast/ });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onBook).not.toHaveBeenCalled();
  });

  it('shows Booked and disables when the member already booked', async () => {
    await render(<ClassCard gymClass={base} alreadyBooked busy={false} onBook={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Booked HIIT Blast/ })).toBeDisabled();
  });
});

describe('upcomingOnly', () => {
  it('drops classes that have already started', () => {
    const past: GymClass = { ...base, id: 'past', startsAt: '2030-01-15T09:00:00.000Z' };
    const future: GymClass = { ...base, id: 'future', startsAt: '2030-01-15T11:00:00.000Z' };
    const now = new Date('2030-01-15T10:00:00.000Z').getTime();
    expect(upcomingOnly([past, future], now).map((c) => c.id)).toEqual(['future']);
  });
});

describe('groupByDay', () => {
  it('groups classes by date in time order', () => {
    const a: GymClass = { ...base, id: 'a', startsAt: '2030-01-16T09:00:00.000Z' };
    const b: GymClass = { ...base, id: 'b', startsAt: '2030-01-15T09:00:00.000Z' };
    const c: GymClass = { ...base, id: 'c', startsAt: '2030-01-15T09:30:00.000Z' };
    const sections = groupByDay([a, b, c]);
    expect(sections.map((s) => s.data.map((x) => x.id))).toEqual([['b', 'c'], ['a']]);
  });
});
