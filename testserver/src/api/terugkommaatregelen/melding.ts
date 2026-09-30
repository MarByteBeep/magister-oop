import { formatTime, getNow } from '@/lib/shared/dateUtils';
import type { ReturnMeasureReportRequest } from '@/magister/response/returnMeasureReport.types';
import { getAllStaffMembers, getReturnMeasureTemplates, writeReturnMeasureTemplates } from '../utils/helpers';
import type { StoredReturnMeasureTemplate } from '../utils/returnMeasures';

function matchesMeasureId(template: StoredReturnMeasureTemplate, measureId: number): boolean {
	if (template.id === measureId) return true;

	const dayCount = Math.max(template.dayCount ?? 1, 1);
	for (let dayIndex = 1; dayIndex < dayCount; dayIndex++) {
		if (template.id * 100 + dayIndex === measureId) return true;
	}
	return false;
}

function invalidPayload(): Response {
	return new Response(JSON.stringify({ error: 'Invalid payload' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function PUT(req: Request, measureId: number): Promise<Response> {
	const data = getReturnMeasureTemplates();
	let studentId: number | null = null;
	let templateIndex = -1;
	let templates: StoredReturnMeasureTemplate[] = [];

	for (const [studentIdKey, studentTemplates] of Object.entries(data)) {
		const index = studentTemplates.findIndex((template) => matchesMeasureId(template, measureId));
		if (index === -1) continue;
		studentId = Number(studentIdKey);
		templateIndex = index;
		templates = studentTemplates;
		break;
	}

	if (studentId == null || templateIndex === -1) {
		return new Response(JSON.stringify({ error: 'Return measure not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	let body: ReturnMeasureReportRequest;
	try {
		body = (await req.json()) as ReturnMeasureReportRequest;
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	if (body.type !== 'Tijdig' && body.type !== 'NietTijdig') {
		return invalidPayload();
	}

	const reported = body.type === 'Tijdig';
	const current = templates[templateIndex];
	const nextTemplates = [...templates];
	nextTemplates[templateIndex] = {
		...current,
		hasReported: reported,
		hasNotReported: !reported,
		// Magister treats a report as handling the measure (`afgehandeldOp` / `afgehandeldDoor`).
		handledTime: current.handledTime ?? formatTime(getNow()),
		handledById: current.handledById ?? getAllStaffMembers()[0]?.id ?? null,
	};
	writeReturnMeasureTemplates({ ...data, [studentId]: nextTemplates });

	console.log(`Updated return measure report ${measureId} → ${body.type}`);
	return new Response(null, { status: 204 });
}
