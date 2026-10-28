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

function matchesAnyDraft(hover: AgendaSlotSelection, drafts: AgendaSlotSelection[]): boolean {
	return drafts.some((draft) => agendaSlotSelectionsEqual(hover, draft));
}

/**
 * Keep committed draft selections visible while hovering another slot.
 * Hover is omitted when it matches any draft range (no double ghost).
 */
export function buildAgendaOverlayEvents(
	selectingPreview: AgendaSlotSelection | null,
	draftSelections: AgendaSlotSelection[],
	hoverSelection: AgendaSlotSelection | null,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	draftLabel?: string | null,
): CalendarEvent[] {
	if (selectingPreview) return [draftOverlayEvent(selectingPreview, draftLabel)];

	const overlays: CalendarEvent[] = draftSelections.map((draft) => draftOverlayEvent(draft, draftLabel));

	const showHover =
		hoverSelection != null && onSelectSlot != null && !matchesAnyDraft(hoverSelection, draftSelections);
	if (showHover && hoverSelection) overlays.push(hoverLessonSlotToBackgroundEvent(hoverSelection));

	return overlays;
}
