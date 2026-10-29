import { formatTime, getNow } from '@/lib/shared/dateUtils';
import type { ReturnMeasureReportRequest } from '@/magister/response/returnMeasureReport.types';
import { getAllStaffMembers, getReturnMeasureTemplates, writeReturnMeasureTemplates } from '../utils/helpers';
import type { StoredReturnMeasureTemplate } from '../utils/returnMeasures';

function dayDerivedMeasureId(templateId: number, dayIndex: number): number {
	return templateId * 100 + dayIndex;
}

function templateDayCount(template: StoredReturnMeasureTemplate): number {
	const raw = template.dayCount;
	if (raw == null) return 1;
	return Math.max(raw, 1);
}

function matchesDerivedDayId(template: StoredReturnMeasureTemplate, measureId: number): boolean {
	const dayCount = templateDayCount(template);
	for (let dayIndex = 1; dayIndex < dayCount; dayIndex++) {
		if (dayDerivedMeasureId(template.id, dayIndex) === measureId) return true;
	}
	return false;
}

function matchesMeasureId(template: StoredReturnMeasureTemplate, measureId: number): boolean {
	if (template.id === measureId) return true;
	return matchesDerivedDayId(template, measureId);
}

function invalidPayload(): Response {
	return new Response(JSON.stringify({ error: 'Invalid payload' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' },
	});
}

function notFoundResponse(): Response {
	return new Response(JSON.stringify({ error: 'Return measure not found' }), {
		status: 404,
		headers: { 'Content-Type': 'application/json' },
	});
}

function invalidJsonResponse(): Response {
	return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' },
	});
}

type FoundTemplate = {
	studentId: number;
	templateIndex: number;
	templates: StoredReturnMeasureTemplate[];
	data: Record<string, StoredReturnMeasureTemplate[]>;
};

function findTemplateByMeasureId(measureId: number): FoundTemplate | null {
	const data = getReturnMeasureTemplates();
	for (const [studentIdKey, studentTemplates] of Object.entries(data)) {
		const index = studentTemplates.findIndex((template) => matchesMeasureId(template, measureId));
		if (index === -1) continue;
		return {
			studentId: Number(studentIdKey),
			templateIndex: index,
			templates: studentTemplates,
			data,
		};
	}
	return null;
}

function isReportType(type: string): type is ReturnMeasureReportRequest['type'] {
	if (type === 'Tijdig') return true;
	return type === 'NietTijdig';
}

async function parseReportBody(req: Request): Promise<ReturnMeasureReportRequest | null> {
	try {
		return (await req.json()) as ReturnMeasureReportRequest;
	} catch {
		return null;
	}
}

function validateReportBody(body: ReturnMeasureReportRequest | null): Response | ReturnMeasureReportRequest {
	if (!body) return invalidJsonResponse();
	if (!isReportType(body.type)) return invalidPayload();
	return body;
}

function resolveHandledTime(current: StoredReturnMeasureTemplate): string {
	if (current.handledTime) return current.handledTime;
	return formatTime(getNow());
}

function firstStaffMemberId(): number | null {
	const staff = getAllStaffMembers()[0];
	if (!staff) return null;
	return staff.id;
}

function resolveHandledById(current: StoredReturnMeasureTemplate): number | null {
	if (current.handledById != null) return current.handledById;
	return firstStaffMemberId();
}

function applyReportToTemplate(current: StoredReturnMeasureTemplate, reported: boolean): StoredReturnMeasureTemplate {
	return {
		...current,
		hasReported: reported,
		hasNotReported: !reported,
		// Magister treats a report as handling the measure (`afgehandeldOp` / `afgehandeldDoor`).
		handledTime: resolveHandledTime(current),
		handledById: resolveHandledById(current),
	};
}

function writeReportedTemplate(found: FoundTemplate, reported: boolean): void {
	const current = found.templates[found.templateIndex];
	const nextTemplates = [...found.templates];
	nextTemplates[found.templateIndex] = applyReportToTemplate(current, reported);
	writeReturnMeasureTemplates({ ...found.data, [found.studentId]: nextTemplates });
}

function isReportedType(type: ReturnMeasureReportRequest['type']): boolean {
	return type === 'Tijdig';
}

export async function PUT(req: Request, measureId: number): Promise<Response> {
	const found = findTemplateByMeasureId(measureId);
	if (!found) return notFoundResponse();

	const validated = validateReportBody(await parseReportBody(req));
	if (validated instanceof Response) return validated;

	writeReportedTemplate(found, isReportedType(validated.type));
	console.log(`Updated return measure report ${measureId} → ${validated.type}`);
	return new Response(null, { status: 204 });
}
