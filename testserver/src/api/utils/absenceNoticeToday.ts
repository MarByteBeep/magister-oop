import { absenceNoticeOverlapsDate } from '@/lib/absence-notice/utils';
import type { AbsenceNotice } from '@/magister/response/absenceNotice.types';
import type { StudentBase } from '@/magister/response/student.types';
import { expandAbsenceNoticeTemplates } from './absenceNotices';
import type { StoredAbsenceNoticeTemplate } from './absenceNotices.types';
import { getAbsenceNoticeTemplates, getAllStudents } from './helpers';

function noticesOverlappingDate(
	templates: StoredAbsenceNoticeTemplate[],
	student: StudentBase,
	dateKey: string,
): AbsenceNotice[] {
	return expandAbsenceNoticeTemplates(templates, student).filter((notice) =>
		absenceNoticeOverlapsDate(notice, dateKey),
	);
}

function noticesForStudent(
	student: StudentBase,
	templatesByStudent: Record<string, StoredAbsenceNoticeTemplate[]>,
	dateKey: string,
): AbsenceNotice[] {
	const templates = templatesByStudent[student.externeId] ?? [];
	if (templates.length === 0) return [];
	return noticesOverlappingDate(templates, student, dateKey);
}

export function collectAbsenceNoticesForDate(dateKey: string): AbsenceNotice[] {
	const templatesByStudent = getAbsenceNoticeTemplates();
	const items: AbsenceNotice[] = [];
	for (const student of getAllStudents()) {
		items.push(...noticesForStudent(student, templatesByStudent, dateKey));
	}
	return items;
}

export function requestDateKey(req: Request, fallback: string): string {
	const value = new URL(req.url).searchParams.get('date');
	if (value === null) return fallback;
	return value;
}
