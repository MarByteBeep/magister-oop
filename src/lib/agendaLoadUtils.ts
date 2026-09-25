import type { AbsenceNoticeLoadDayState } from '@/lib/absenceNoticeLoadState';
import { isFetchSettled } from '@/lib/absenceNoticeLoadState';
import { eachDateKey, getDateKey } from '@/lib/dateUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
export function agendaEntriesForDate(entries: AgendaEntry[], dateKey: string): AgendaEntry[] {
	return entries.filter((entry) => getDateKey(new Date(entry.start)) === dateKey);
}

/** Apply a successful range fetch: every requested day gets entries or an empty array. */
export function mergeFetchedAgendaForRange(
	existingAgenda: Record<string, AgendaEntry[]> | undefined,
	dailyItems: Record<string, AgendaEntry[]>,
	dateKeys: string[],
): Record<string, AgendaEntry[]> {
	const updatedAgenda = { ...existingAgenda };
	for (const dateKey of dateKeys) {
		updatedAgenda[dateKey] = dailyItems[dateKey] ?? [];
	}
	return updatedAgenda;
}

export function isAgendaDayLoaded(agenda: Record<string, AgendaEntry[]> | undefined, dateKey: string): boolean {
	return agenda?.[dateKey] !== undefined;
}

/** Whether the agenda or the absence-notice load state still needs a fetch for this day. */
export function needsAgendaDayFetch(
	agenda: Record<string, AgendaEntry[]> | undefined,
	dateKey: string,
	absenceNoticeLoad: Record<string, AbsenceNoticeLoadDayState> | undefined,
): boolean {
	if (!isAgendaDayLoaded(agenda, dateKey)) return true;
	if (!isFetchSettled(absenceNoticeLoad, dateKey)) return true;
	return false;
}

/** Agenda days are loaded and absence-notice auto-fetch has finished (success or give-up). */
export function isAgendaRangeReady(
	agenda: Record<string, AgendaEntry[]> | undefined,
	start: Date,
	end: Date,
	absenceNoticeLoad: Record<string, AbsenceNoticeLoadDayState> | undefined,
): boolean {
	return eachDateKey(start, end).every((dateKey) => {
		if (!isAgendaDayLoaded(agenda, dateKey)) return false;
		return isFetchSettled(absenceNoticeLoad, dateKey);
	});
}

/** Whether any day in the inclusive range still needs an agenda or absence-notice fetch. */
export function needsAgendaRangeFetch(
	agenda: Record<string, AgendaEntry[]> | undefined,
	start: Date,
	end: Date,
	absenceNoticeLoad: Record<string, AbsenceNoticeLoadDayState> | undefined,
): boolean {
	return eachDateKey(start, end).some((dateKey) => needsAgendaDayFetch(agenda, dateKey, absenceNoticeLoad));
}

export function isAgendaRangeLoaded(
	agenda: Record<string, AgendaEntry[]> | undefined,
	start: Date,
	end: Date,
): boolean {
	const current = new Date(start);
	while (current <= end) {
		if (!isAgendaDayLoaded(agenda, getDateKey(current))) return false;
		current.setDate(current.getDate() + 1);
	}
	return true;
}
