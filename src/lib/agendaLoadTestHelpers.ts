import type { AbsenceNoticeLoadDayState } from '@/lib/absenceNoticeLoadState';

export function loadedForDateKeys(dateKeys: string[]): Record<string, AbsenceNoticeLoadDayState> {
	return Object.fromEntries(dateKeys.map((dateKey) => [dateKey, { loaded: true }]));
}

export function withFetchAttempts(dateKeys: string[], attempts: number): Record<string, AbsenceNoticeLoadDayState> {
	return Object.fromEntries(dateKeys.map((dateKey) => [dateKey, { loaded: false, fetchAttempts: attempts }]));
}
