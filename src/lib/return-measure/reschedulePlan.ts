import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { nextSchoolDay, selectionDateKey } from '@/lib/return-measure/reschedule';
import { buildReschedulePlans, mergeContiguousSelections } from '@/lib/return-measure/rescheduleSelections';
import { getDateKey } from '@/lib/shared/dateUtils';

export function buildReschedulePlanParts(selections: AgendaSlotSelection[], description: string) {
	const parts = mergeContiguousSelections(selections);
	return {
		parts,
		plans: buildReschedulePlans(parts, description),
	};
}

export function rescheduleHighlightDateKey(
	selections: AgendaSlotSelection[],
	bounds: { start: Date; end: Date } | null,
): string | null {
	const first = selections[0];
	if (first) return selectionDateKey(first);
	if (bounds) return getDateKey(nextSchoolDay(bounds.start));
	return null;
}
