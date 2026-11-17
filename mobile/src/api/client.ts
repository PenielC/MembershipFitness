import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { BookingView, CheckInResult, Gym, GymClass, MemberProfile, MemberStats } from './types';

/** An error response from the API (or a network failure, status 0). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Where the API lives. Override with EXPO_PUBLIC_API_URL. Otherwise use the machine running Metro
 * (works for a physical device on the same Wi-Fi), falling back to the Android emulator alias or localhost.
 */
export function resolveBaseUrl(): string {
  const override = process.env['EXPO_PUBLIC_API_URL'];
  if (override) return override.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && Platform.OS !== 'web') return `http://${host}:3000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

function isErrorBody(value: unknown): value is { error: { code: string; message: string } } {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const err = (value as { error: unknown }).error;
  return typeof err === 'object' && err !== null && 'code' in err && 'message' in err;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${resolveBaseUrl()}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection and try again.');
  }
  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    if (isErrorBody(data)) throw new ApiError(res.status, data.error.code, data.error.message);
    throw new ApiError(res.status, 'UNKNOWN', 'Something went wrong. Please try again.');
  }
  return data as T;
}

export const api = {
  getMember: (id: string) => request<MemberProfile>('GET', `/api/members/${id}`),
  getStats: (id: string) => request<MemberStats>('GET', `/api/members/${id}/stats`),
  getBookings: (id: string) => request<{ bookings: BookingView[] }>('GET', `/api/members/${id}/bookings`),
  getGyms: () => request<{ gyms: Gym[] }>('GET', '/api/gyms'),
  getClasses: (gymId: string) => request<{ classes: GymClass[] }>('GET', `/api/gyms/${gymId}/classes`),
  bookClass: (classId: string, memberId: string) => request<BookingView>('POST', `/api/classes/${classId}/book`, { memberId }),
  cancelBooking: (classId: string, memberId: string) => request<void>('DELETE', `/api/classes/${classId}/book/${memberId}`),
  checkIn: (memberId: string, gymId: string) => request<CheckInResult>('POST', '/api/check-in', { memberId, gymId }),
};
