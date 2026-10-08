import type { TransformAgendaSelection } from '@/hooks/agenda/useAgendaCalendarSelection';
import { hhmmToDate } from '@/lib/agenda/bigCalendarUtils';
import type { HoveredAgendaSlot } from '@/lib/agenda/lessonHours';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { formatTime, getDateKey, parseDateKey } from '@/lib/shared/dateUtils';

/** Build a slot selection from a hovered lesson/appointment slot, then apply an optional transform. */
export function resolveAgendaHoverSelection(
	hoveredSlot: HoveredAgendaSlot | null,
	transformSelection?: TransformAgendaSelection,
): AgendaSlotSelection | null {
	if (!hoveredSlot) return null;

	const day = parseDateKey(hoveredSlot.dateKey);
	const raw: AgendaSlotSelection = {
		start: hhmmToDate(day, hoveredSlot.startTime),
		end: hhmmToDate(day, hoveredSlot.endTime),
	};
	if (!transformSelection) return raw;
	return transformSelection(raw);
}

/** Persist a hover as the (possibly transformed) time span so overlays match the measure shape. */
export function hoveredSlotFromSelection(selection: AgendaSlotSelection): HoveredAgendaSlot {
	return {
		dateKey: getDateKey(selection.start),
		startTime: formatTime(selection.start),
		endTime: formatTime(selection.end),
	};
}
