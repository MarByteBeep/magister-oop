import { createElement, useCallback, useMemo } from 'react';
import type { EventProps, View } from 'react-big-calendar';
import AgendaCalendarEvent from '@/components/student/AgendaCalendarEvent';
import AgendaCalendarHeader from '@/components/student/AgendaCalendarHeader';
import AgendaFullDayShortcutCellWrapper from '@/components/student/AgendaFullDayShortcutCellWrapper';
import { firstLessonTime, lastLessonTime } from '@/components/student/agendaCalendarConfig';
import {
	calendarDayPropGetter,
	calendarEventPropGetter,
	calendarTooltipAccessor,
	createCalendarSlotPropGetter,
} from '@/hooks/agendaCalendarPropGetters';
import { useAgendaCalendarEvents } from '@/hooks/useAgendaCalendarEvents';
import { useAgendaCalendarSelection } from '@/hooks/useAgendaCalendarSelection';
import { useStableAgendaEntry } from '@/hooks/useStableAgendaEntries';
import type { CalendarEvent } from '@/lib/agendaCalendarUtils';
import { agendaDayLayoutAlgorithm } from '@/lib/agendaDayLayout';
import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { hhmmToDate } from '@/lib/bigCalendarUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';

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
	const {
		selectingPreview,
		hoveredLessonSlot,
		setHoveredLessonSlot,
		clearHoverTimeoutRef,
		handleSelecting,
		handleSelectFullDay,
		handleSelectSlot,
	} = useAgendaCalendarSelection(onSelectSlot);

	const activePreview = draftSelection ?? selectingPreview;

	const { calendarEvents, occupiedLessonHours, overlappingEventIds } = useAgendaCalendarEvents(
		entries,
		date,
		view,
		activePreview,
		hoveredLessonSlot,
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
			createCalendarSlotPropGetter(
				occupiedLessonHours,
				activePreview,
				onSelectSlot,
				setHoveredLessonSlot,
				clearHoverTimeoutRef,
			),
		[occupiedLessonHours, activePreview, onSelectSlot, setHoveredLessonSlot, clearHoverTimeoutRef],
	);

	const weekFullDayShortcut = view === 'work_week' && onSelectSlot !== undefined;
	const stableActiveEntry = useStableAgendaEntry(activeEntry);

	const components = useMemo(
		() => ({
			header: (props: { date: Date; label: string }) =>
				createElement(AgendaCalendarHeader, {
					...props,
					onSelectFullDay: weekFullDayShortcut ? handleSelectFullDay : undefined,
				}),
			dateCellWrapper: weekFullDayShortcut ? AgendaFullDayShortcutCellWrapper : undefined,
			event: (props: EventProps<CalendarEvent>) =>
				createElement(AgendaCalendarEvent, { ...props, activeEntry: stableActiveEntry, overlappingEventIds }),
		}),
		[stableActiveEntry, handleSelectFullDay, overlappingEventIds, weekFullDayShortcut],
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
