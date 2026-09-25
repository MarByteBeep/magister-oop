import { getAgendaEntryKey, isAbsenceNoticeEntry, isLessonEntry, isReturnMeasureEntry } from '@/lib/agendaEntryUtils';
import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { getAgendaItemInfo, getBreakPeriods } from '@/lib/agendaUtils';
import { hhmmToDate } from '@/lib/bigCalendarUtils';
import { getDateKey, parseDateKey } from '@/lib/dateUtils';
import { getReturnMeasureDisplay } from '@/lib/returnMeasureUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';

export type CalendarEvent = {
	id: string;
	title: string;
	start: Date;
	end: Date;
	resource?: AgendaEntry;
	isDraft?: boolean;
	isHoverSlot?: boolean;
	isBreak?: boolean;
};

export function isDraftCalendarEvent(event: CalendarEvent): boolean {
	return event.isDraft === true;
}

export function isHoverSlotCalendarEvent(event: CalendarEvent): boolean {
	return event.isHoverSlot === true;
}

export function isBreakCalendarEvent(event: CalendarEvent): boolean {
	return event.isBreak === true;
}

export function isBackgroundOverlayCalendarEvent(event: CalendarEvent): boolean {
	return isDraftCalendarEvent(event) || isHoverSlotCalendarEvent(event);
}

export function breakPeriodsToCalendarEvents(dates: Date[]): CalendarEvent[] {
	const periods = getBreakPeriods();

	return dates.flatMap((day) => {
		const dateKey = getDateKey(day);
		const dayStart = parseDateKey(dateKey);
		return periods.map((period) => ({
			id: `break-${dateKey}-${period.start}`,
			title: 'Pauze',
			start: hhmmToDate(dayStart, period.start),
			end: hhmmToDate(dayStart, period.end),
			isBreak: true,
		}));
	});
}

export function hoverLessonSlotToBackgroundEvent(selection: AgendaSlotSelection): CalendarEvent {
	return {
		id: 'hover-lesson-slot',
		title: '',
		start: selection.start,
		end: selection.end,
		isHoverSlot: true,
	};
}

export function draftSelectionToBackgroundEvent(
	selection: AgendaSlotSelection,
	options?: { title?: string },
): CalendarEvent {
	return {
		id: 'draft-return-measure',
		title: options?.title ?? 'Nieuwe terugkommaatregel',
		start: selection.start,
		end: selection.end,
		isDraft: true,
	};
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function agendaEntryToCalendarEvent(entry: AgendaEntry): CalendarEvent {
	const title = (() => {
		if (isReturnMeasureEntry(entry)) return getReturnMeasureDisplay(entry.measure).primaryLabel;
		if (isAbsenceNoticeEntry(entry)) return entry.notice.attendanceTypeDescription;
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
	const lessonEvents = events.filter((event) => event.resource && isLessonEntry(event.resource));

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
