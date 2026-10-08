import { useCallback, useMemo } from 'react';
import { firstLessonTime, lastLessonTime } from '@/components/student/agenda/agendaCalendarConfig';
import { buildAgendaCalendarComponents } from '@/hooks/agenda/agendaCalendarComponents';
import { calendarDayPropGetter, createCalendarSlotPropGetter } from '@/hooks/agenda/agendaCalendarPropGetters';
import type { TransformAgendaSelection } from '@/hooks/agenda/useAgendaCalendarSelection';
import { useStableAgendaEntry } from '@/hooks/agenda/useStableAgendaEntries';
import { hhmmToDate } from '@/lib/agenda/bigCalendarUtils';
import type { CalendarEvent } from '@/lib/agenda/calendarUtils';
import type { HoveredAgendaSlot } from '@/lib/agenda/lessonHours';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

interface AgendaCalendarChromeInput {
	date: Date;
	view: string;
	activeEntry: AgendaEntry | null | undefined;
	onSelectEntry: (entry: AgendaEntry) => void;
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined;
	createMode: boolean;
	suppressHover: boolean;
	setHoveredSlot: (slot: HoveredAgendaSlot | null) => void;
	clearHoverTimeoutRef: { current: number | undefined };
	handleSelectFullDay: (day: Date) => void;
	overlappingEventIds: Set<string>;
	highlightDateKey?: string | null;
	focusReturnMeasureId?: number | null;
	transformSelection?: TransformAgendaSelection;
}

export function useAgendaCalendarChrome({
	date,
	view,
	activeEntry,
	onSelectEntry,
	onSelectSlot,
	createMode,
	suppressHover,
	setHoveredSlot,
	clearHoverTimeoutRef,
	handleSelectFullDay,
	overlappingEventIds,
	highlightDateKey,
	focusReturnMeasureId = null,
	transformSelection,
}: AgendaCalendarChromeInput) {
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
				suppressHover,
				createMode,
				onSelectSlot,
				setHoveredSlot,
				clearHoverTimeoutRef,
				transformSelection,
			),
		[suppressHover, createMode, onSelectSlot, setHoveredSlot, clearHoverTimeoutRef, transformSelection],
	);

	const fullDayShortcutEnabled = view === 'work_week' && onSelectSlot !== undefined && createMode;
	/** Create-mode copy only; reschedule keeps the day click without "Aanmaken vierkant rooster". */
	const showFullDayCreateTooltip = fullDayShortcutEnabled && focusReturnMeasureId == null;
	const stableActiveEntry = useStableAgendaEntry(activeEntry);

	const dayPropGetter = useMemo(
		() => (day: Date) => calendarDayPropGetter(day, highlightDateKey),
		[highlightDateKey],
	);

	const components = useMemo(
		() =>
			buildAgendaCalendarComponents({
				fullDayShortcutEnabled,
				showFullDayCreateTooltip,
				handleSelectFullDay,
				highlightDateKey,
				stableActiveEntry,
				overlappingEventIds,
				onSelectEntry,
				ghostReturnMeasure: createMode && focusReturnMeasureId == null,
				focusReturnMeasureId,
			}),
		[
			stableActiveEntry,
			handleSelectFullDay,
			overlappingEventIds,
			fullDayShortcutEnabled,
			showFullDayCreateTooltip,
			onSelectEntry,
			highlightDateKey,
			createMode,
			focusReturnMeasureId,
		],
	);

	return { min, max, handleSelectEvent, slotPropGetter, dayPropGetter, components };
}
