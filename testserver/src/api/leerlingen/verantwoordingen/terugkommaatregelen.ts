import { dayOffsetFromIsoInstant, isLocalTimeLabel } from '@/lib/dateUtils';
import type { CreateReturnMeasureRequest } from '@/magister/response/create-return-measure.types';
import { appendReturnMeasureTemplate, getAllStudents } from '../../utils/helpers';
import type { StoredReturnMeasureTemplate } from '../../utils/returnMeasures';

function parseDayCount(rawDayCount: string): number | null {
	const parsed = Number.parseInt(rawDayCount, 10);
	if (!Number.isFinite(parsed) || parsed < 1) return null;
	return parsed;
}

function invalidPayload(): Response {
	return new Response(JSON.stringify({ error: 'Invalid payload' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function POST(req: Request, studentId: number): Promise<Response> {
	const student = getAllStudents().find((item) => item.id === studentId);
	if (!student) {
		return new Response(JSON.stringify({ error: 'Student not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	let body: CreateReturnMeasureRequest;
	try {
		body = (await req.json()) as CreateReturnMeasureRequest;
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const dayOffset = dayOffsetFromIsoInstant(body.terugkomenOp);
	const dayCount = parseDayCount(body.aantalDagen);
	if (
		dayOffset == null ||
		dayCount == null ||
		body.omschrijving.trim().length === 0 ||
		!isLocalTimeLabel(body.beginTijd) ||
		!isLocalTimeLabel(body.eindTijd)
	) {
		return invalidPayload();
	}

	const template: StoredReturnMeasureTemplate = {
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

	appendReturnMeasureTemplate(studentId, template);
	console.log(`Created return measure for student ${studentId}`, body);

	return new Response(null, { status: 204 });
}
