import { getAgendaEntryKey, isAbsenceNoticeEntry, isLessonEntry, isReturnMeasureEntry } from '@/lib/agendaEntryUtils';
import { getAgendaItemInfo } from '@/lib/agendaUtils';
import { getReturnMeasureDisplay } from '@/lib/returnMeasureUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';

export type CalendarEvent = {
	id: string;
	title: string;
	start: Date;
	end: Date;
	resource: AgendaEntry;
};

export function isSameCalendarDay(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function agendaEntryToCalendarEvent(entry: AgendaEntry): CalendarEvent {
	const title = (() => {
		if (isReturnMeasureEntry(entry)) return getReturnMeasureDisplay(entry.measure).primaryLabel;
		if (isAbsenceNoticeEntry(entry)) return entry.notice.attendanceTypeDesc;
		const { courseDescriptions, subject } = getAgendaItemInfo(entry.item);
		return courseDescriptions ?? subject ?? 'Les';
	})();

	return {
		id: getAgendaEntryKey(entry),
		title,
		start: new Date(entry.start),
		end: new Date(entry.end),
		resource: entry,
	};
}

export function agendaEntriesToCalendarEvents(entries: AgendaEntry[]): CalendarEvent[] {
	return entries.map(agendaEntryToCalendarEvent);
}

/** Overlap packing for compact lesson UI; overlay entries are ignored. */
export function getOverlappingEventIds(events: CalendarEvent[]): Set<string> {
	const overlappingIds = new Set<string>();
	const lessonEvents = events.filter((event) => isLessonEntry(event.resource));

	for (let i = 0; i < lessonEvents.length; i++) {
		for (let j = i + 1; j < lessonEvents.length; j++) {
			const a = lessonEvents[i];
			const b = lessonEvents[j];
			if (!a || !b) continue;

			const sameDay = isSameCalendarDay(a.start, b.start);
			const overlaps = a.start < b.end && a.end > b.start;

			if (sameDay && overlaps) {
				overlappingIds.add(a.id);
				overlappingIds.add(b.id);
			}
		}
	}

	return overlappingIds;
}
