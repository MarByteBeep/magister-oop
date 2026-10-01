import { createElement, useCallback, useMemo } from 'react';
import type { EventProps, View } from 'react-big-calendar';
import AgendaCalendarEvent from '@/components/student/agenda/AgendaCalendarEvent';
import AgendaCalendarHeader from '@/components/student/agenda/AgendaCalendarHeader';
import AgendaFullDayShortcutCellWrapper from '@/components/student/agenda/AgendaFullDayShortcutCellWrapper';
import { firstLessonTime, lastLessonTime } from '@/components/student/agenda/agendaCalendarConfig';
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

export function useAgendaCalendar(
	entries: AgendaEntry[],
	date: Date,
	view: View,
	activeEntry: AgendaEntry | null | undefined,
	onSelectEntry: (entry: AgendaEntry) => void,
	options?: {
		draftSelection?: AgendaSlotSelection | null;
		onSelectSlot?: (selection: AgendaSlotSelection) => void;
	},
) {
	const { draftSelection, onSelectSlot } = options ?? {};
	const createMode = useCreateAppointmentMode(onSelectSlot !== undefined);
	const {
		selectingPreview,
		hoveredSlot,
		setHoveredSlot,
		clearHoverTimeoutRef,
		handleSelecting,
		handleSelectFullDay,
		handleSelectSlot,
	} = useAgendaCalendarSelection(onSelectSlot, createMode);

	const activePreview = draftSelection ?? selectingPreview;

	const { calendarEvents, overlappingEventIds } = useAgendaCalendarEvents(
		entries,
		date,
		view,
		activePreview,
		hoveredSlot,
		onSelectSlot,
	);

	const dateTimestamp = date.getTime();
	const min = useMemo(() => hhmmToDate(new Date(dateTimestamp), firstLessonTime), [dateTimestamp]);
	const max = useMemo(() => hhmmToDate(new Date(dateTimestamp), lastLessonTime), [dateTimestamp]);

	const handleSelectEvent = useCallback(
		(ev: CalendarEvent) => {
			if (ev.isDraft || ev.isHoverSlot || ev.isBreak || !ev.resource) return;
			onSelectEntry(ev.resource);
		},
		[onSelectEntry],
	);

	const slotPropGetter = useMemo(
		() =>
			createCalendarSlotPropGetter(activePreview, createMode, onSelectSlot, setHoveredSlot, clearHoverTimeoutRef),
		[activePreview, createMode, onSelectSlot, setHoveredSlot, clearHoverTimeoutRef],
	);

	const weekFullDayShortcut = view === 'work_week' && onSelectSlot !== undefined;
	const fullDayCreateEnabled = weekFullDayShortcut && createMode;
	const stableActiveEntry = useStableAgendaEntry(activeEntry);

	const components = useMemo(
		() => ({
			header: (props: { date: Date; label: string }) =>
				createElement(AgendaCalendarHeader, {
					...props,
					onSelectFullDay: fullDayCreateEnabled ? handleSelectFullDay : undefined,
				}),
			dateCellWrapper: fullDayCreateEnabled ? AgendaFullDayShortcutCellWrapper : undefined,
			event: (props: EventProps<CalendarEvent>) =>
				createElement(AgendaCalendarEvent, { ...props, activeEntry: stableActiveEntry, overlappingEventIds }),
		}),
		[stableActiveEntry, handleSelectFullDay, overlappingEventIds, fullDayCreateEnabled],
	);

	const views: View[] = view === 'work_week' ? ['work_week'] : ['day'];

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
		views,
		dayLayoutAlgorithm: agendaDayLayoutAlgorithm,
	};
}
