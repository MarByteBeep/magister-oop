import { useMemo } from 'react';
import type { View } from 'react-big-calendar';
import { calendarEventPropGetter, calendarTooltipAccessor } from '@/hooks/agenda/agendaCalendarPropGetters';
import type { AgendaSelectionMode } from '@/hooks/agenda/agendaSelectionMode';
import { resolveAgendaHoverSelection } from '@/hooks/agenda/resolveAgendaHoverSelection';
import { useAgendaCalendarChrome } from '@/hooks/agenda/useAgendaCalendarChrome';
import { useAgendaCalendarEvents } from '@/hooks/agenda/useAgendaCalendarEvents';
import { type TransformAgendaSelection, useAgendaCalendarSelection } from '@/hooks/agenda/useAgendaCalendarSelection';
import { useAgendaCreateMode } from '@/hooks/agenda/useAgendaCreateMode';
import type { CalendarEvent } from '@/lib/agenda/calendarUtils';
import { agendaDayLayoutAlgorithm } from '@/lib/agenda/dayLayout';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

export type { AgendaSelectionMode } from '@/hooks/agenda/agendaSelectionMode';

export function useAgendaCalendar(
	entries: AgendaEntry[],
	date: Date,
	view: View,
	activeEntry: AgendaEntry | null | undefined,
	onSelectEntry: (entry: AgendaEntry) => void,
	options?: {
		draftSelection?: AgendaSlotSelection | null;
		draftLabel?: string | null;
		onSelectSlot?: (selection: AgendaSlotSelection) => void;
		selectionMode?: AgendaSelectionMode;
		highlightDateKey?: string | null;
		focusReturnMeasureId?: number | null;
		transformSelection?: TransformAgendaSelection;
	},
) {
	const {
		draftSelection = null,
		draftLabel = null,
		onSelectSlot,
		selectionMode = 'ctrl',
		highlightDateKey,
		focusReturnMeasureId = null,
		transformSelection,
	} = options ?? {};
	const { slotSelectionEnabled, createMode } = useAgendaCreateMode(selectionMode, onSelectSlot);
	const {
		selectingPreview,
		hoveredSlot,
		setHoveredSlot,
		clearHoverTimeoutRef,
		handleSelecting,
		handleSelectFullDay,
		handleSelectSlot,
	} = useAgendaCalendarSelection(onSelectSlot, createMode, transformSelection);

	// Slot getter already stores transformed times when transformSelection is set; resolve again for safety.
	const hoverSelection = useMemo(
		() => resolveAgendaHoverSelection(hoveredSlot, transformSelection),
		[hoveredSlot, transformSelection],
	);

	const { calendarEvents, overlappingEventIds } = useAgendaCalendarEvents(
		entries,
		date,
		view,
		selectingPreview,
		draftSelection,
		hoverSelection,
		onSelectSlot,
		draftLabel,
	);

	const chrome = useAgendaCalendarChrome({
		date,
		view,
		activeEntry,
		onSelectEntry,
		onSelectSlot,
		createMode,
		suppressHover: selectingPreview != null,
		setHoveredSlot,
		clearHoverTimeoutRef,
		handleSelectFullDay,
		overlappingEventIds,
		highlightDateKey,
		focusReturnMeasureId,
		transformSelection,
	});

	return {
		events: calendarEvents,
		backgroundEvents: [] as CalendarEvent[],
		min: chrome.min,
		max: chrome.max,
		handleSelectEvent: chrome.handleSelectEvent,
		handleSelecting,
		handleSelectSlot,
		createMode,
		rescheduleMode: focusReturnMeasureId != null,
		slotSelectionEnabled,
		dayPropGetter: chrome.dayPropGetter,
		slotPropGetter: chrome.slotPropGetter,
		eventPropGetter: calendarEventPropGetter,
		tooltipAccessor: calendarTooltipAccessor,
		components: chrome.components,
		views: (view === 'work_week' ? ['work_week'] : ['day']) as View[],
		dayLayoutAlgorithm: agendaDayLayoutAlgorithm,
	};
}
