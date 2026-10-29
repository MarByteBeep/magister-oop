import { dayOffsetFromIsoInstant, isLocalTimeLabel } from '@/lib/shared/dateUtils';
import type { CreateReturnMeasureRequest } from '@/magister/response/createReturnMeasure.types';
import { getAllStudents } from './helpers';
import { jsonError, readJsonBody } from './jsonResponses';
import type { StoredReturnMeasureTemplate } from './returnMeasures.types';

export function parseDayCount(rawDayCount: string): number | null {
	const parsed = Number.parseInt(rawDayCount, 10);
	if (!Number.isFinite(parsed)) return null;
	if (parsed < 1) return null;
	return parsed;
}

function hasValidTimes(body: CreateReturnMeasureRequest): boolean {
	return isLocalTimeLabel(body.beginTijd) && isLocalTimeLabel(body.eindTijd);
}

function hasDescription(body: CreateReturnMeasureRequest): boolean {
	return body.omschrijving.trim().length > 0;
}

function hasDescriptionAndTimes(body: CreateReturnMeasureRequest): boolean {
	return hasDescription(body) && hasValidTimes(body);
}

export function isValidCreateReturnMeasure(
	body: CreateReturnMeasureRequest,
	dayOffset: number | null,
	dayCount: number | null,
): boolean {
	if (dayOffset === null) return false;
	if (dayCount === null) return false;
	return hasDescriptionAndTimes(body);
}

export function toReturnMeasureTemplate(
	body: CreateReturnMeasureRequest,
	dayOffset: number,
	dayCount: number,
): StoredReturnMeasureTemplate {
	return {
		id: Date.now(),
		dayOffset,
		description: body.omschrijving.trim(),
		measure: null,
		startTime: body.beginTijd,
		endTime: body.eindTijd,
		dayCount,
		hasReported: false,
		hasNotReported: false,
		handledTime: null,
		handledById: null,
	};
}

export function parseCreateReturnMeasureOffsets(body: CreateReturnMeasureRequest): {
	dayOffset: number | null;
	dayCount: number | null;
} {
	return {
		dayOffset: dayOffsetFromIsoInstant(body.terugkomenOp),
		dayCount: parseDayCount(body.aantalDagen),
	};
}

export function studentExistsById(studentId: number): boolean {
	return getAllStudents().some((item) => item.id === studentId);
}

export type ParsedCreateReturnMeasure =
	| { ok: true; body: CreateReturnMeasureRequest; dayOffset: number; dayCount: number }
	| { ok: false; response: Response };

export async function parseCreateReturnMeasureRequest(req: Request): Promise<ParsedCreateReturnMeasure> {
	const body = await readJsonBody<CreateReturnMeasureRequest>(req);
	if (body === null) return { ok: false, response: jsonError('Invalid JSON', 400) };

	const { dayOffset, dayCount } = parseCreateReturnMeasureOffsets(body);
	if (!isValidCreateReturnMeasure(body, dayOffset, dayCount)) {
		return { ok: false, response: jsonError('Invalid payload', 400) };
	}

	return { ok: true, body, dayOffset: dayOffset as number, dayCount: dayCount as number };
}
