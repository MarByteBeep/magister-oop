import { useMemo, useRef } from 'react';
import type { View } from 'react-big-calendar';
import { hhmmToDate } from '@/lib/agenda/bigCalendarUtils';
import {
	agendaEntriesToCalendarEvents,
	breakPeriodsToCalendarEvents,
	type CalendarEvent,
	draftSelectionToBackgroundEvent,
	getOverlappingEventIds,
	hoverLessonSlotToBackgroundEvent,
} from '@/lib/agenda/calendarUtils';
import { getFullDayScheduleLabel, isFullDayScheduleSelection } from '@/lib/agenda/fullDayScheduleUtils';
import {
	formatLessonHoursCompact,
	getOverlappingLessonHoursForSelection,
	type HoveredAgendaSlot,
} from '@/lib/agenda/lessonHours';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { getWeekDays, parseDateKey } from '@/lib/shared/dateUtils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

function registrationKey(event: CalendarEvent): string {
	return (event.registrations ?? []).map((entry) => `${entry.registration.id}:${entry.start}`).join(',');
}

function calendarEventTimesEqual(a: CalendarEvent, b: CalendarEvent): boolean {
	if (a.start.getTime() !== b.start.getTime()) return false;
	return a.end.getTime() === b.end.getTime();
}

function calendarEventFlagsEqual(a: CalendarEvent, b: CalendarEvent): boolean {
	if (a.isDraft !== b.isDraft) return false;
	if (a.isHoverSlot !== b.isHoverSlot) return false;
	return a.isBreak === b.isBreak;
}

function calendarEventIdentityEqual(a: CalendarEvent, b: CalendarEvent): boolean {
	if (a.id !== b.id) return false;
	return a.resource === b.resource;
}

function calendarEventCoreEqual(a: CalendarEvent, b: CalendarEvent): boolean {
	if (!calendarEventIdentityEqual(a, b)) return false;
	return calendarEventTimesEqual(a, b);
}

function calendarEventEqual(a: CalendarEvent, b: CalendarEvent): boolean {
	if (!calendarEventCoreEqual(a, b)) return false;
	if (!calendarEventFlagsEqual(a, b)) return false;
	return registrationKey(a) === registrationKey(b);
}

function calendarEventsEqual(a: CalendarEvent[], b: CalendarEvent[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((event, index) => {
		const other = b[index];
		if (!other) return false;
		return calendarEventEqual(event, other);
	});
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
	if (a.size !== b.size) return false;
	return [...a].every((id) => b.has(id));
}

function buildDraftOverlay(activePreview: AgendaSlotSelection): CalendarEvent[] {
	const isFullDay = isFullDayScheduleSelection(activePreview);
	const lessonHours = getOverlappingLessonHoursForSelection(activePreview);
	const lessonLabel = formatLessonHoursCompact(lessonHours);
	const title = isFullDay ? getFullDayScheduleLabel() : (lessonLabel ?? 'Nieuwe terugkommaatregel');
	return [draftSelectionToBackgroundEvent(activePreview, { title })];
}

function buildHoverOverlay(hoveredSlot: HoveredAgendaSlot): CalendarEvent[] {
	const hoverDate = parseDateKey(hoveredSlot.dateKey);
	return [
		hoverLessonSlotToBackgroundEvent({
			start: hhmmToDate(hoverDate, hoveredSlot.startTime),
			end: hhmmToDate(hoverDate, hoveredSlot.endTime),
		}),
	];
}

function canShowHoverOverlay(
	hoveredSlot: HoveredAgendaSlot | null,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
): hoveredSlot is HoveredAgendaSlot {
	if (!hoveredSlot) return false;
	return Boolean(onSelectSlot);
}

function buildOverlayEvents(
	activePreview: AgendaSlotSelection | null,
	hoveredSlot: HoveredAgendaSlot | null,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
): CalendarEvent[] {
	if (activePreview) return buildDraftOverlay(activePreview);
	if (!canShowHoverOverlay(hoveredSlot, onSelectSlot)) return [];
	return buildHoverOverlay(hoveredSlot);
}

export function useAgendaCalendarEvents(
	entries: AgendaEntry[],
	date: Date,
	view: View,
	activePreview: AgendaSlotSelection | null,
	hoveredSlot: HoveredAgendaSlot | null,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
) {
	const dateTimestamp = date.getTime();
	const events = useMemo(() => agendaEntriesToCalendarEvents(entries), [entries]);
	const visibleDates = useMemo(() => {
		const resolvedDate = new Date(dateTimestamp);
		if (view === 'work_week') return getWeekDays(resolvedDate);
		return [resolvedDate];
	}, [dateTimestamp, view]);
	const breakEvents = useMemo(() => breakPeriodsToCalendarEvents(visibleDates), [visibleDates]);
	const overlayEvents = useMemo(
		() => buildOverlayEvents(activePreview, hoveredSlot, onSelectSlot),
		[activePreview, hoveredSlot, onSelectSlot],
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

	return { calendarEvents, overlappingEventIds };
}
