import { compactUuid } from '@/lib/uuidUtils';
import type { AbsenceNoticesResponse } from '@/magister/response/absence-notice.types';
import { expandAbsenceNoticeTemplates } from '../../utils/absenceNotices';
import { getAbsenceNoticeTemplates } from '../../utils/helpers';

export async function GET(_req: Request, studentUuid: string): Promise<Response> {
	// Stored under the dashed externeId, requested in compact form like the real API.
	const requested = compactUuid(studentUuid);
	const templates =
		Object.entries(getAbsenceNoticeTemplates()).find(([uuid]) => compactUuid(uuid) === requested)?.[1] ?? [];
	const items: AbsenceNoticesResponse = expandAbsenceNoticeTemplates(templates);

	return new Response(JSON.stringify(items), {
		headers: { 'Content-Type': 'application/json' },
	});
}
