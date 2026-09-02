import { getDateKey } from '@/lib/dateUtils';
import type { Student } from '@/magister/types';

function isLegacyAgendaEntry(entry: unknown): boolean {
	if (typeof entry !== 'object' || entry === null) return false;
	if (!('kind' in entry)) return true;
	return 'begin' in entry && !('start' in entry);
}

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

/** Drop empty per-day agenda entries and invalidate pre-AgendaEntry cache shapes. */
export function repairStaleAgendaCache(student: Student): Student {
	if (!student.agenda) return student;

	const hasLegacyEntries = Object.values(student.agenda).some((items) => items.some(isLegacyAgendaEntry));
	if (hasLegacyEntries) {
		return {
			...student,
			agenda: undefined,
			returnMeasuresLoadedFor: undefined,
			absenceNoticesLoadedFor: undefined,
		};
	}

	const agenda = { ...student.agenda };
	const returnMeasuresLoadedFor = student.returnMeasuresLoadedFor
		? { ...student.returnMeasuresLoadedFor }
		: undefined;
	const absenceNoticesLoadedFor = student.absenceNoticesLoadedFor
		? { ...student.absenceNoticesLoadedFor }
		: undefined;
	let changed = false;

	for (const [dateKey, items] of Object.entries(agenda)) {
		if (items.length > 0) continue;
		delete agenda[dateKey];
		if (returnMeasuresLoadedFor?.[dateKey]) {
			delete returnMeasuresLoadedFor[dateKey];
		}
		if (absenceNoticesLoadedFor?.[dateKey]) {
			delete absenceNoticesLoadedFor[dateKey];
		}
		changed = true;
	}

	if (!changed) return student;

	return {
		...student,
		agenda: Object.keys(agenda).length > 0 ? agenda : undefined,
		returnMeasuresLoadedFor:
			returnMeasuresLoadedFor && Object.keys(returnMeasuresLoadedFor).length > 0
				? returnMeasuresLoadedFor
				: undefined,
		absenceNoticesLoadedFor:
			absenceNoticesLoadedFor && Object.keys(absenceNoticesLoadedFor).length > 0
				? absenceNoticesLoadedFor
				: undefined,
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
