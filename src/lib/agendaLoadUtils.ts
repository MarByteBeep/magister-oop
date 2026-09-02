import { getDateKey } from '@/lib/dateUtils';
import type { Student } from '@/magister/types';

export function isAgendaDayLoaded(student: Student, dateKey: string): boolean {
	return student.agenda?.[dateKey] !== undefined;
}

/** Whether agenda and/or return measures still need to be fetched for this day. */
export function needsAgendaDayFetch(student: Student, dateKey: string): boolean {
	if (!isAgendaDayLoaded(student, dateKey)) return true;
	if (student.returnMeasuresLoadedFor?.[dateKey] !== true) return true;
	return false;
}

/** Drop empty per-day agenda entries so a broken cache does not block refetching. */
export function repairStaleAgendaCache(student: Student): Student {
	if (!student.agenda) return student;

	const agenda = { ...student.agenda };
	const loadedFor = student.returnMeasuresLoadedFor ? { ...student.returnMeasuresLoadedFor } : undefined;
	let changed = false;

	for (const [dateKey, items] of Object.entries(agenda)) {
		if (items.length > 0) continue;
		delete agenda[dateKey];
		if (loadedFor?.[dateKey]) {
			delete loadedFor[dateKey];
		}
		changed = true;
	}

	if (!changed) return student;

	return {
		...student,
		agenda: Object.keys(agenda).length > 0 ? agenda : undefined,
		returnMeasuresLoadedFor: loadedFor && Object.keys(loadedFor).length > 0 ? loadedFor : undefined,
	};
}

export function isAgendaRangeLoaded(student: Student, start: Date, end: Date): boolean {
	const current = new Date(start);
	while (current <= end) {
		if (!isAgendaDayLoaded(student, getDateKey(current))) return false;
		current.setDate(current.getDate() + 1);
	}
	return true;
}

export function markReturnMeasuresLoadedForRange(
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
