import { absenceNoticeOverlapsDate } from '@/lib/absenceNoticeUtils';
import { getTodayKey } from '@/lib/dateUtils';
import type { AbsenceNotice, AbsenceNoticesResponse } from '@/magister/response/absence-notice.types';
import { expandAbsenceNoticeTemplates } from '../../utils/absenceNotices';
import { getAbsenceNoticeTemplates, getAllStudents } from '../../utils/helpers';

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const dateKey = url.searchParams.get('date') ?? getTodayKey();
	const templatesByStudent = getAbsenceNoticeTemplates();
	const items: AbsenceNotice[] = [];

	for (const student of getAllStudents()) {
		const templates = templatesByStudent[student.externeId] ?? [];
		if (templates.length === 0) continue;
		for (const notice of expandAbsenceNoticeTemplates(templates, student)) {
			if (absenceNoticeOverlapsDate(notice, dateKey)) items.push(notice);
		}
	}

	const response: AbsenceNoticesResponse = {
		overviewDate: `${dateKey}T00:00:00`,
		count: items.length,
		top: 0,
		skip: 0,
		items,
	};

	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}
