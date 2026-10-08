import {
	type CalendarEvent,
	draftSelectionToBackgroundEvent,
	hoverLessonSlotToBackgroundEvent,
} from '@/lib/agenda/calendarUtils';
import { getFullDayScheduleLabel, isFullDayScheduleSelection } from '@/lib/agenda/fullDayScheduleUtils';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';

export function agendaSlotSelectionsEqual(
	left: AgendaSlotSelection | null | undefined,
	right: AgendaSlotSelection | null | undefined,
): boolean {
	if (left == null || right == null) return left == null && right == null;
	return left.start.getTime() === right.start.getTime() && left.end.getTime() === right.end.getTime();
}

function draftOverlayEvent(selection: AgendaSlotSelection, draftLabel?: string | null): CalendarEvent {
	const trimmedLabel = draftLabel?.trim() ?? '';
	if (trimmedLabel) {
		return draftSelectionToBackgroundEvent(selection, { title: trimmedLabel });
	}

	// Hour drafts without a label: ghost shows time + badges only.
	const title = isFullDayScheduleSelection(selection) ? getFullDayScheduleLabel() : '';
	return draftSelectionToBackgroundEvent(selection, { title });
}

/**
 * Keep the committed selection visible while hovering another slot.
 * Hover replaces draft only when it matches the same range (no double ghost).
 */
export function buildAgendaOverlayEvents(
	selectingPreview: AgendaSlotSelection | null,
	draftSelection: AgendaSlotSelection | null,
	hoverSelection: AgendaSlotSelection | null,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	draftLabel?: string | null,
): CalendarEvent[] {
	if (selectingPreview) return [draftOverlayEvent(selectingPreview, draftLabel)];

	const overlays: CalendarEvent[] = [];
	if (draftSelection) overlays.push(draftOverlayEvent(draftSelection, draftLabel));

	const showHover =
		hoverSelection != null && onSelectSlot != null && !agendaSlotSelectionsEqual(hoverSelection, draftSelection);
	if (showHover && hoverSelection) overlays.push(hoverLessonSlotToBackgroundEvent(hoverSelection));

	return overlays;
}
