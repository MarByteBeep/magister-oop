import { createElement, useCallback, useMemo } from 'react';
import type { EventProps, View } from 'react-big-calendar';
import AgendaCalendarEvent from '@/components/student/agenda/calendar/AgendaCalendarEvent';
import AgendaCalendarHeader from '@/components/student/agenda/calendar/AgendaCalendarHeader';
import AgendaFullDayShortcutCellWrapper from '@/components/student/agenda/calendar/AgendaFullDayShortcutCellWrapper';
import { firstLessonTime, lastLessonTime } from '@/components/student/agenda/calendar/agendaCalendarConfig';
import {
	calendarDayPropGetter,
	calendarEventPropGetter,
	calendarTooltipAccessor,
	createCalendarSlotPropGetter,
} from '@/hooks/agenda/agendaCalendarPropGetters';
import { useAgendaCalendarEvents } from '@/hooks/agenda/useAgendaCalendarEvents';
import { useAgendaCalendarSelection } from '@/hooks/agenda/useAgendaCalendarSelection';
import { useCreateAppointmentMode } from '@/hooks/agenda/useCreateAppointmentMode';
import { useStableAgendaEntry } from '@/hooks/agenda/useStableAgendaEntries';
import { hhmmToDate } from '@/lib/agenda/bigCalendarUtils';
import type { CalendarEvent } from '@/lib/agenda/calendarUtils';
import { agendaDayLayoutAlgorithm } from '@/lib/agenda/dayLayout';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

export type AgendaCalendarOptions = {
	draftSelection?: AgendaSlotSelection | null;
	onSelectSlot?: (selection: AgendaSlotSelection) => void;
};

function isOverlayCalendarEvent(ev: CalendarEvent): boolean {
	if (ev.isDraft) return true;
	if (ev.isHoverSlot) return true;
	return Boolean(ev.isBreak);
}

function isSelectableCalendarEvent(ev: CalendarEvent): boolean {
	if (isOverlayCalendarEvent(ev)) return false;
	return Boolean(ev.resource);
}

function agendaViewsFor(view: View): View[] {
	if (view === 'work_week') return ['work_week'];
	return ['day'];
}

function weekFullDayCreateEnabled(
	view: View,
	onSelectSlot: AgendaCalendarOptions['onSelectSlot'],
	createMode: boolean,
) {
	if (view !== 'work_week') return false;
	if (onSelectSlot === undefined) return false;
	return createMode;
}

function buildAgendaCalendarComponents(input: {
	fullDayCreateEnabled: boolean;
	handleSelectFullDay: (date: Date) => void;
	stableActiveEntry: AgendaEntry | null | undefined;
	overlappingEventIds: Set<string>;
	onSelectEntry: (entry: AgendaEntry) => void;
}) {
	const fullDaySelect = input.fullDayCreateEnabled ? input.handleSelectFullDay : undefined;
	return {
		header: (props: { date: Date; label: string }) =>
			createElement(AgendaCalendarHeader, {
				...props,
				onSelectFullDay: fullDaySelect,
			}),
		dateCellWrapper: input.fullDayCreateEnabled ? AgendaFullDayShortcutCellWrapper : undefined,
		event: (props: EventProps<CalendarEvent>) =>
			createElement(AgendaCalendarEvent, {
				...props,
				activeEntry: input.stableActiveEntry,
				overlappingEventIds: input.overlappingEventIds,
				onSelectRegistration: input.onSelectEntry,
			}),
	};
}

function useAgendaCalendarSelectionState(onSelectSlot: AgendaCalendarOptions['onSelectSlot']) {
	const createMode = useCreateAppointmentMode(onSelectSlot !== undefined);
	const selection = useAgendaCalendarSelection(onSelectSlot, createMode);
	return { createMode, ...selection };
}

function useAgendaCalendarBounds(date: Date) {
	const dateTimestamp = date.getTime();
	const min = useMemo(() => hhmmToDate(new Date(dateTimestamp), firstLessonTime), [dateTimestamp]);
	const max = useMemo(() => hhmmToDate(new Date(dateTimestamp), lastLessonTime), [dateTimestamp]);
	return { min, max };
}

export function useAgendaCalendar(
	entries: AgendaEntry[],
	date: Date,
	view: View,
	activeEntry: AgendaEntry | null | undefined,
	onSelectEntry: (entry: AgendaEntry) => void,
	options?: AgendaCalendarOptions,
) {
	const { draftSelection, onSelectSlot } = options ?? {};
	const {
		createMode,
		selectingPreview,
		hoveredSlot,
		setHoveredSlot,
		clearHoverTimeoutRef,
		handleSelecting,
		handleSelectFullDay,
		handleSelectSlot,
	} = useAgendaCalendarSelectionState(onSelectSlot);

	const activePreview = draftSelection ?? selectingPreview;
	const { calendarEvents, overlappingEventIds } = useAgendaCalendarEvents(
		entries,
		date,
		view,
		activePreview,
		hoveredSlot,
		onSelectSlot,
	);
	const { min, max } = useAgendaCalendarBounds(date);

	const handleSelectEvent = useCallback(
		(ev: CalendarEvent) => {
			if (!isSelectableCalendarEvent(ev)) return;
			onSelectEntry(ev.resource as AgendaEntry);
		},
		[onSelectEntry],
	);

	const slotPropGetter = useMemo(
		() =>
			createCalendarSlotPropGetter(activePreview, createMode, onSelectSlot, setHoveredSlot, clearHoverTimeoutRef),
		[activePreview, createMode, onSelectSlot, setHoveredSlot, clearHoverTimeoutRef],
	);

	const fullDayCreateEnabled = weekFullDayCreateEnabled(view, onSelectSlot, createMode);
	const stableActiveEntry = useStableAgendaEntry(activeEntry);

	const components = useMemo(
		() =>
			buildAgendaCalendarComponents({
				fullDayCreateEnabled,
				handleSelectFullDay,
				stableActiveEntry,
				overlappingEventIds,
				onSelectEntry,
			}),
		[stableActiveEntry, handleSelectFullDay, overlappingEventIds, fullDayCreateEnabled, onSelectEntry],
	);

	return {
		events: calendarEvents,
		backgroundEvents: [] as CalendarEvent[],
		min,
		max,
		handleSelectEvent,
		handleSelecting,
		handleSelectSlot,
		createMode,
		slotSelectionEnabled: onSelectSlot !== undefined,
		dayPropGetter: calendarDayPropGetter,
		slotPropGetter,
		eventPropGetter: calendarEventPropGetter,
		tooltipAccessor: calendarTooltipAccessor,
		components,
		views: agendaViewsFor(view),
		dayLayoutAlgorithm: agendaDayLayoutAlgorithm,
	};
}
