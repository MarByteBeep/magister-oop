import { randomUUID } from 'node:crypto';
import { dayOffsetFromIsoInstant, formatTime } from '@/lib/shared/dateUtils';
import type { CreateAbsenceNoticeRequest } from '@/magister/response/attendanceType.types';
import type { StoredAbsenceNoticeTemplate } from './absenceNotices.types';
import { getAllStudents } from './helpers';
import { jsonError, readJsonBody } from './jsonResponses';

function hasOffsets(startOffset: number | null, endOffset: number | null): boolean {
	if (startOffset === null) return false;
	return endOffset !== null;
}

export function isValidCreateAbsenceNotice(
	body: CreateAbsenceNoticeRequest,
	studentUuid: string,
	startOffset: number | null,
	endOffset: number | null,
): boolean {
	if (body.studentId !== studentUuid) return false;
	if (!body.attendanceTypeCode.trim()) return false;
	return hasOffsets(startOffset, endOffset);
}

export function toAbsenceNoticeTemplate(
	body: CreateAbsenceNoticeRequest,
	startOffset: number,
	endOffset: number,
): StoredAbsenceNoticeTemplate {
	const startDate = new Date(body.startDateTime);
	const endDate = new Date(body.endDateTime);
	return {
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
}

export function parseAbsenceNoticeOffsets(body: CreateAbsenceNoticeRequest): {
	startOffset: number | null;
	endOffset: number | null;
} {
	return {
		startOffset: dayOffsetFromIsoInstant(body.startDateTime),
		endOffset: dayOffsetFromIsoInstant(body.endDateTime),
	};
}

export function studentExistsByUuid(studentUuid: string): boolean {
	return getAllStudents().some((item) => item.externeId === studentUuid);
}

export type ParsedCreateAbsenceNotice =
	| { ok: true; body: CreateAbsenceNoticeRequest; startOffset: number; endOffset: number }
	| { ok: false; response: Response };

export async function parseCreateAbsenceNoticeRequest(
	req: Request,
	studentUuid: string,
): Promise<ParsedCreateAbsenceNotice> {
	const body = await readJsonBody<CreateAbsenceNoticeRequest>(req);
	if (body === null) return { ok: false, response: jsonError('Invalid JSON', 400) };

	const { startOffset, endOffset } = parseAbsenceNoticeOffsets(body);
	if (!isValidCreateAbsenceNotice(body, studentUuid, startOffset, endOffset)) {
		return { ok: false, response: jsonError('Invalid payload', 400) };
	}

	return { ok: true, body, startOffset: startOffset as number, endOffset: endOffset as number };
}
