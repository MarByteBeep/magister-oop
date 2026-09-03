import { getDateKey } from '@/lib/dateUtils';
import type { Student } from '@/magister/types';

export function isAgendaDayLoaded(student: Student, dateKey: string): boolean {
	return student.agenda?.[dateKey] !== undefined;
}

/** Whether agenda, return measures, or absence notices still need to be fetched for this day. */
export function needsAgendaDayFetch(student: Student, dateKey: string): boolean {
	if (!isAgendaDayLoaded(student, dateKey)) return true;
	if (student.returnMeasuresLoadedFor?.[dateKey] !== true) return true;
	if (student.absenceNoticesLoadedFor?.[dateKey] !== true) return true;
	return false;
}

export function isAgendaRangeLoaded(student: Student, start: Date, end: Date): boolean {
	const current = new Date(start);
	while (current <= end) {
		if (!isAgendaDayLoaded(student, getDateKey(current))) return false;
		current.setDate(current.getDate() + 1);
	}
	return true;
}

export function markDateRangeLoaded(
	loadedFor: Record<string, boolean> | undefined,
	start: Date,
	end: Date,
): Record<string, boolean> {
	const next = { ...loadedFor };
	const current = new Date(start);
	while (current <= end) {
		next[getDateKey(current)] = true;
		current.setDate(current.getDate() + 1);
	}
	return next;
}
