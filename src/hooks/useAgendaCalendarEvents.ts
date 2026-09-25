import { useMemo, useRef } from 'react';
import type { View } from 'react-big-calendar';
import {
	agendaEntriesToCalendarEvents,
	breakPeriodsToCalendarEvents,
	type CalendarEvent,
	draftSelectionToBackgroundEvent,
	getOverlappingEventIds,
	hoverLessonSlotToBackgroundEvent,
} from '@/lib/agendaCalendarUtils';
import { isLessonEntry } from '@/lib/agendaEntryUtils';
import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { getDateKey, getWeekDays, parseDateKey } from '@/lib/dateUtils';
import { getFullDayScheduleLabel, isFullDayScheduleSelection } from '@/lib/fullDayScheduleUtils';
import {
	findOverlappingLessonIndexRangeByDate,
	formatLessonHoursCompact,
	getLessonHourDateRange,
	getOverlappingLessonHoursForSelection,
} from '@/lib/lessonHours';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';

function collectOccupiedLessonHours(entries: AgendaEntry[]): Set<string> {
	const occupied = new Set<string>();

	for (const entry of entries) {
		if (!isLessonEntry(entry)) continue;

		const entryStart = new Date(entry.start);
		const range = findOverlappingLessonIndexRangeByDate(entryStart, new Date(entry.end));
		if (!range) continue;

		const dateKey = getDateKey(entryStart);
		for (let index = range.from; index <= range.to; index++) {
			occupied.add(`${dateKey}:${index}`);
		}
	}

	return occupied;
}

function calendarEventsEqual(a: CalendarEvent[], b: CalendarEvent[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((event, index) => {
		const other = b[index];
		if (!other) return false;
		return (
			event.id === other.id &&
			event.start.getTime() === other.start.getTime() &&
			event.end.getTime() === other.end.getTime() &&
			event.isDraft === other.isDraft &&
			event.isHoverSlot === other.isHoverSlot &&
			event.isBreak === other.isBreak &&
			event.resource === other.resource
		);
	});
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
	if (a.size !== b.size) return false;
	for (const id of a) {
		if (!b.has(id)) return false;
	}
	return true;
}

function buildOverlayEvents(
	activePreview: AgendaSlotSelection | null,
	hoveredLessonSlot: { dateKey: string; lessonIndex: number } | null,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
): CalendarEvent[] {
	if (activePreview) {
		const isFullDay = isFullDayScheduleSelection(activePreview);
		const lessonHours = getOverlappingLessonHoursForSelection(activePreview);
		const lessonLabel = formatLessonHoursCompact(lessonHours);
		return [
			draftSelectionToBackgroundEvent(activePreview, {
				title: isFullDay ? getFullDayScheduleLabel() : (lessonLabel ?? 'Nieuwe terugkommaatregel'),
			}),
		];
	}

	if (!hoveredLessonSlot || !onSelectSlot) return [];

	const hoverDate = parseDateKey(hoveredLessonSlot.dateKey);
	return [hoverLessonSlotToBackgroundEvent(getLessonHourDateRange(hoverDate, hoveredLessonSlot.lessonIndex))];
}

export function useAgendaCalendarEvents(
	entries: AgendaEntry[],
	date: Date,
	view: View,
	activePreview: AgendaSlotSelection | null,
	hoveredLessonSlot: { dateKey: string; lessonIndex: number } | null,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
) {
	const dateTimestamp = date.getTime();
	const events = useMemo(() => agendaEntriesToCalendarEvents(entries), [entries]);
	const occupiedLessonHours = useMemo(() => collectOccupiedLessonHours(entries), [entries]);
	const visibleDates = useMemo(() => {
		const resolvedDate = new Date(dateTimestamp);
		return view === 'work_week' ? getWeekDays(resolvedDate) : [resolvedDate];
	}, [dateTimestamp, view]);
	const breakEvents = useMemo(() => breakPeriodsToCalendarEvents(visibleDates), [visibleDates]);
	const overlayEvents = useMemo(
		() => buildOverlayEvents(activePreview, hoveredLessonSlot, onSelectSlot),
		[activePreview, hoveredLessonSlot, onSelectSlot],
	);
	const calendarEventsRef = useRef<CalendarEvent[]>([]);
	const calendarEvents = useMemo(() => {
		const next = [...events, ...breakEvents, ...overlayEvents];
		const prev = calendarEventsRef.current;
		if (calendarEventsEqual(next, prev)) return prev;
		calendarEventsRef.current = next;
		return next;
	}, [breakEvents, events, overlayEvents]);
	const overlappingEventIdsRef = useRef(new Set<string>());
	const overlappingEventIds = useMemo(() => {
		const next = getOverlappingEventIds(calendarEvents);
		const prev = overlappingEventIdsRef.current;
		if (setsEqual(next, prev)) return prev;
		overlappingEventIdsRef.current = next;
		return next;
	}, [calendarEvents]);

	return { calendarEvents, occupiedLessonHours, overlappingEventIds };
}
