import { randomUUID } from 'node:crypto';
import { dayOffsetFromIsoInstant, formatTime } from '@/lib/shared/dateUtils';
import type { CreateAbsenceNoticeRequest, CreateAbsenceNoticeResponse } from '@/magister/response/attendanceType.types';
import type { StoredAbsenceNoticeTemplate } from '../../utils/absenceNotices';
import { appendAbsenceNoticeTemplate, getAllStudents, removeAbsenceNoticeTemplate } from '../../utils/helpers';

function invalidPayload(): Response {
	return new Response(JSON.stringify({ error: 'Invalid payload' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' },
	});
}

function studentNotFound(): Response {
	return new Response(JSON.stringify({ error: 'Student not found' }), {
		status: 404,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function POST(req: Request, studentUuid: string): Promise<Response> {
	const student = getAllStudents().find((item) => item.externeId === studentUuid);
	if (!student) return studentNotFound();

	let body: CreateAbsenceNoticeRequest;
	try {
		body = (await req.json()) as CreateAbsenceNoticeRequest;
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const startOffset = dayOffsetFromIsoInstant(body.startDateTime);
	const endOffset = dayOffsetFromIsoInstant(body.endDateTime);
	if (body.studentId !== studentUuid || !body.attendanceTypeCode.trim() || startOffset == null || endOffset == null) {
		return invalidPayload();
	}

	const startDate = new Date(body.startDateTime);
	const endDate = new Date(body.endDateTime);
	const template: StoredAbsenceNoticeTemplate = {
		absenceNoticeId: randomUUID(),
		attendanceTypeCode: body.attendanceTypeCode,
		attendanceTypeDescription: body.attendanceTypeDesc,
		startDayOffset: startOffset,
		startTime: formatTime(startDate),
		endDayOffset: endOffset,
		endTime: formatTime(endDate),
		expectedEndDayOffset: null,
		expectedEndTime: null,
		comment: body.comment,
		internalComment: body.internalComment,
		creator: {
			accountId: randomUUID(),
			role: 'SupportingStaff',
			initials: 'TS',
			lastName: 'Test',
			infix: '',
		},
		isRecurring: false,
	};

	appendAbsenceNoticeTemplate(studentUuid, template);
	console.log(`Created absence notice for student ${studentUuid}`, body);

	const response: CreateAbsenceNoticeResponse = { isValid: true, validationMessages: null };
	return new Response(JSON.stringify(response), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function DELETE(_req: Request, studentUuid: string, absenceNoticeId: string): Promise<Response> {
	const removed = removeAbsenceNoticeTemplate(studentUuid, absenceNoticeId);
	if (!removed) {
		return new Response(JSON.stringify({ error: 'Absence notice not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	console.log(`Deleted absence notice ${absenceNoticeId} for student ${studentUuid}`);
	return new Response(null, { status: 204 });
}
