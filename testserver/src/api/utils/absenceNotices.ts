import { getNow } from '@/lib/shared/dateUtils';
import type { AbsenceNotice } from '@/magister/response/absenceNotice.types';
import type { StudentBase } from '@/magister/response/student.types';
import { buildAbsenceNotice } from './absenceNoticeExpand';
import type { StoredAbsenceNoticeTemplate } from './absenceNotices.types';

export type { StoredAbsenceNoticeTemplate } from './absenceNotices.types';

export function expandAbsenceNoticeTemplates(
	templates: StoredAbsenceNoticeTemplate[],
	student: StudentBase,
): AbsenceNotice[] {
	const today = getNow();
	return templates.map((template) => buildAbsenceNotice(template, student, today));
}
