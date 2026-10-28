import { agendaSlotSelectionsEqual } from '@/lib/agenda/agendaOverlayEvents';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { selectionToFormValues } from '@/lib/agenda/slotSelection';
import type { CreateReturnMeasureFormInput } from '@/lib/return-measure/createRequest';
import { getDateKey } from '@/lib/shared/dateUtils';

/** Replace selection, or Ctrl/Cmd-toggle a slot in/out of the multi-select set. */
export function applyRescheduleSlotSelection(
	current: AgendaSlotSelection[],
	next: AgendaSlotSelection,
	options?: { additive?: boolean },
): AgendaSlotSelection[] {
	if (!options?.additive) return [next];

	const index = current.findIndex((selection) => agendaSlotSelectionsEqual(selection, next));
	if (index >= 0) return current.filter((_, i) => i !== index);
	return [...current, next];
}

/**
 * Sort selections and merge same-day ranges that touch or overlap into contiguous parts.
 * Each part becomes one create request.
 */
export function mergeContiguousSelections(selections: AgendaSlotSelection[]): AgendaSlotSelection[] {
	if (selections.length === 0) return [];

	const sorted = [...selections].sort((left, right) => left.start.getTime() - right.start.getTime());
	const [first, ...rest] = sorted;
	if (!first) return [];

	const merged: AgendaSlotSelection[] = [];
	let current: AgendaSlotSelection = { start: first.start, end: first.end };

	for (const next of rest) {
		const sameDay = getDateKey(current.start) === getDateKey(next.start);
		const contiguousOrOverlapping = current.end.getTime() >= next.start.getTime();

		if (sameDay && contiguousOrOverlapping) {
			if (next.end.getTime() > current.end.getTime()) {
				current = { start: current.start, end: next.end };
			}
			continue;
		}

		merged.push(current);
		current = { start: next.start, end: next.end };
	}

	merged.push(current);
	return merged;
}

export function buildReschedulePlans(
	parts: AgendaSlotSelection[],
	description: string,
): CreateReturnMeasureFormInput[] {
	if (description.trim().length === 0) return [];
	return parts.map((part) => ({
		...selectionToFormValues(part),
		description,
		dayCount: 1,
	}));
}
