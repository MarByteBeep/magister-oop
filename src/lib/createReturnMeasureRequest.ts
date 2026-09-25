import { buildAgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { toISOFromDateKeyAndTime } from '@/lib/dateUtils';
import type { CreateReturnMeasureRequest } from '@/magister/response/create-return-measure.types';

export type CreateReturnMeasureFormInput = {
	dateKey: string;
	startTime: string;
	endTime: string;
	description: string;
	dayCount: number;
};

export function buildCreateReturnMeasureRequest(
	input: CreateReturnMeasureFormInput,
): CreateReturnMeasureRequest | null {
	const selection = buildAgendaSlotSelection(input.dateKey, input.startTime, input.endTime);
	if (
		!selection ||
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
