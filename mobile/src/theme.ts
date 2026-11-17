import type { ClassType, MembershipTier } from './api/types';

export const colors = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  text: '#1B1F2A',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#4F46E5',
  onPrimary: '#FFFFFF',
  flame: '#F97316',
  success: '#15803D',
  successBg: '#DCFCE7',
  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
  disabled: '#D1D5DB',
} as const;

export const tierColors: Record<MembershipTier, { bg: string; fg: string }> = {
  basic: { bg: '#E5E7EB', fg: '#374151' },
  premium: { bg: '#E0E7FF', fg: '#3730A3' },
  elite: { bg: '#FEF3C7', fg: '#92400E' },
};

export const typeColors: Record<ClassType, { bg: string; fg: string; label: string }> = {
  yoga: { bg: '#DCFCE7', fg: '#166534', label: 'Yoga' },
  hiit: { bg: '#FEE2E2', fg: '#991B1B', label: 'HIIT' },
  spin: { bg: '#DBEAFE', fg: '#1E40AF', label: 'Spin' },
};
