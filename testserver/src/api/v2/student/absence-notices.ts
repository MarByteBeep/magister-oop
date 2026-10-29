import type { CreateAbsenceNoticeResponse } from '@/magister/response/attendanceType.types';
import {
	parseCreateAbsenceNoticeRequest,
	studentExistsByUuid,
	toAbsenceNoticeTemplate,
} from '../../utils/createAbsenceNotice';
import { appendAbsenceNoticeTemplate, removeAbsenceNoticeTemplate } from '../../utils/helpers';
import { jsonError, jsonOk } from '../../utils/jsonResponses';

export async function POST(req: Request, studentUuid: string): Promise<Response> {
	if (!studentExistsByUuid(studentUuid)) return jsonError('Student not found', 404);

	const parsed = await parseCreateAbsenceNoticeRequest(req, studentUuid);
	if (!parsed.ok) return parsed.response;

	const template = toAbsenceNoticeTemplate(parsed.body, parsed.startOffset, parsed.endOffset);
	appendAbsenceNoticeTemplate(studentUuid, template);
	console.log(`Created absence notice for student ${studentUuid}`, parsed.body);

	const response: CreateAbsenceNoticeResponse = {
		isValid: true,
		validationMessages: null,
	};
	return jsonOk(response);
}

export async function DELETE(_req: Request, studentUuid: string, absenceNoticeId: string): Promise<Response> {
	const removed = removeAbsenceNoticeTemplate(studentUuid, absenceNoticeId);
	if (!removed) return jsonError('Absence notice not found', 404);

	console.log(`Deleted absence notice ${absenceNoticeId} for student ${studentUuid}`);
	return new Response(null, { status: 204 });
}
