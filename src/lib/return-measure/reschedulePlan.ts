import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { selectionToFormValues } from '@/lib/agenda/slotSelection';
import type { CreateReturnMeasureFormInput } from '@/lib/return-measure/createRequest';
import { nextSchoolDay, selectionDateKey } from '@/lib/return-measure/reschedule';
import { getDateKey } from '@/lib/shared/dateUtils';

export function buildReschedulePlan(
	selection: AgendaSlotSelection | null,
	description: string,
): CreateReturnMeasureFormInput | null {
	if (!selection || description.trim().length === 0) return null;
	return {
		...selectionToFormValues(selection),
		description,
		dayCount: 1,
	};
}

export function rescheduleHighlightDateKey(
	selection: AgendaSlotSelection | null,
	bounds: { start: Date; end: Date } | null,
): string | null {
	if (selection) return selectionDateKey(selection);
	if (bounds) return getDateKey(nextSchoolDay(bounds.start));
	return null;
}
