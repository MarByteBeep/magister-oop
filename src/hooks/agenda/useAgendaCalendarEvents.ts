import { useMemo, useRef } from 'react';
import type { View } from 'react-big-calendar';
import { buildAgendaOverlayEvents } from '@/lib/agenda/agendaOverlayEvents';
import {
	agendaEntriesToCalendarEvents,
	breakPeriodsToCalendarEvents,
	type CalendarEvent,
	getOverlappingEventIds,
} from '@/lib/agenda/calendarUtils';
import { clearDraftAppearClaims } from '@/lib/agenda/draftAppear';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { getWeekDays } from '@/lib/shared/dateUtils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

function registrationKey(event: CalendarEvent): string {
	return (event.registrations ?? []).map((entry) => `${entry.registration.id}:${entry.start}`).join(',');
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
			event.title === other.title &&
			event.resource === other.resource &&
			registrationKey(event) === registrationKey(other)
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

export function useAgendaCalendarEvents(
	entries: AgendaEntry[],
	date: Date,
	view: View,
	selectingPreview: AgendaSlotSelection | null,
	draftSelection: AgendaSlotSelection | null,
	hoverSelection: AgendaSlotSelection | null,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	draftLabel?: string | null,
) {
	const dateTimestamp = date.getTime();
	const events = useMemo(() => agendaEntriesToCalendarEvents(entries), [entries]);
	const visibleDates = useMemo(() => {
		const resolvedDate = new Date(dateTimestamp);
		return view === 'work_week' ? getWeekDays(resolvedDate) : [resolvedDate];
	}, [dateTimestamp, view]);
	const breakEvents = useMemo(() => breakPeriodsToCalendarEvents(visibleDates), [visibleDates]);
	const hadDraftRef = useRef(false);
	if (draftSelection == null && selectingPreview == null) {
		if (hadDraftRef.current) clearDraftAppearClaims();
		hadDraftRef.current = false;
	} else {
		hadDraftRef.current = true;
	}
	const overlayEvents = useMemo(
		() => buildAgendaOverlayEvents(selectingPreview, draftSelection, hoverSelection, onSelectSlot, draftLabel),
		[selectingPreview, draftSelection, hoverSelection, onSelectSlot, draftLabel],
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
