import { buildAgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { isReturnMeasureDateInPast } from '@/lib/return-measure/scheduleBounds';
import { getNow, toISOFromDateKeyAndTime } from '@/lib/shared/dateUtils';
import type { CreateReturnMeasureRequest } from '@/magister/response/createReturnMeasure.types';

export type CreateReturnMeasureFormInput = {
	dateKey: string;
	startTime: string;
	endTime: string;
	description: string;
	dayCount: number;
};

export function buildCreateReturnMeasureRequest(
	input: CreateReturnMeasureFormInput,
	now: Date = getNow(),
): CreateReturnMeasureRequest | null {
	const selection = buildAgendaSlotSelection(input.dateKey, input.startTime, input.endTime);
	if (
		!selection ||
		isReturnMeasureDateInPast(input.dateKey, now) ||
		input.description.trim().length === 0 ||
		!Number.isInteger(input.dayCount) ||
		input.dayCount < 1
	) {
		return null;
	}

	return {
		omschrijving: input.description.trim(),
		terugkomenOp: toISOFromDateKeyAndTime(input.dateKey, '00:00'),
		beginTijd: input.startTime,
		eindTijd: input.endTime,
		aantalDagen: String(input.dayCount),
	};
}
