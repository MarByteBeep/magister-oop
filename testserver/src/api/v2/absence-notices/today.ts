import { getTodayKey } from '@/lib/shared/dateUtils';
import type { AbsenceNoticesResponse } from '@/magister/response/absenceNotice.types';
import { collectAbsenceNoticesForDate, requestDateKey } from '../../utils/absenceNoticeToday';
import { jsonOk } from '../../utils/jsonResponses';

export async function GET(req: Request): Promise<Response> {
	const dateKey = requestDateKey(req, getTodayKey());
	const items = collectAbsenceNoticesForDate(dateKey);

	const response: AbsenceNoticesResponse = {
		overviewDate: `${dateKey}T00:00:00`,
		count: items.length,
		top: 0,
		skip: 0,
		items,
	};

	return jsonOk(response);
}
