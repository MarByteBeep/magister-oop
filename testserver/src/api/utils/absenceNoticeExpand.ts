import { addDays, getDateKey, toISOFromDateKeyAndTime } from '@/lib/shared/dateUtils';
import type { AbsenceNotice } from '@/magister/response/absenceNotice.types';
import type { StudentBase } from '@/magister/response/student.types';
import type { StoredAbsenceNoticeTemplate } from './absenceNotices.types';

const UNIT = { id: 'af5e4311-d487-48e1-8b0f-519423e1e0ee', name: 'VP' };

function startOfDay(date: Date): Date {
	const copy = new Date(date);
	copy.setHours(0, 0, 0, 0);
	return copy;
}

function isWeekday(date: Date): boolean {
	const weekday = date.getDay();
	return weekday !== 0 && weekday !== 6;
}

export function countSchoolDays(start: Date, end: Date): number {
	let count = 0;
	const current = startOfDay(start);
	const last = startOfDay(end);
	while (current <= last) {
		if (isWeekday(current)) count++;
		current.setDate(current.getDate() + 1);
	}
	return Math.max(count, 1);
}

function studentNumber(student: StudentBase): number {
	const parsed = Number.parseInt(student.code, 10);
	if (Number.isNaN(parsed)) return student.id;
	return parsed;
}

function resolveOptionalDateKey(today: Date, offset: number | null): string | null {
	if (offset === null) return null;
	return getDateKey(addDays(today, offset));
}

function resolveOptionalDateTime(dateKey: string | null, time: string | null): string | null {
	if (dateKey === null) return null;
	if (time === null) return null;
	return toISOFromDateKeyAndTime(dateKey, time);
}

function firstDefined(primary: string | null, secondary: string | null, fallback: string): string {
	if (primary !== null) return primary;
	if (secondary !== null) return secondary;
	return fallback;
}

function buildNoticeStudent(student: StudentBase): AbsenceNotice['student'] {
	return {
		id: student.externeId,
		firstName: student.roepnaam,
		lastName: student.achternaam,
		infix: student.tussenvoegsel ?? '',
		groups: student.klassen,
		studies: student.studies,
		zenId: student.id,
		studentNumber: studentNumber(student),
		hasPhoto: Boolean(student.links.foto),
	};
}

function noticeHref(studentUuid: string, noticeId: string): string {
	return `https://attendance.magister.net/api/v2/student/${studentUuid}/absence-notices/${noticeId}`;
}

function buildNoticeLinks(studentUuid: string, noticeId: string): AbsenceNotice['links'] {
	const href = noticeHref(studentUuid, noticeId);
	return [
		{ href, rel: 'Modify', method: 'PUT' },
		{ href, rel: 'Withdraw', method: 'DELETE' },
		{ href: '', rel: 'Patch', method: 'PATCH' },
	];
}

export function buildAbsenceNotice(
	template: StoredAbsenceNoticeTemplate,
	student: StudentBase,
	today: Date,
): AbsenceNotice {
	const startDateKey = getDateKey(addDays(today, template.startDayOffset));
	const endDateKey = resolveOptionalDateKey(today, template.endDayOffset);
	const expectedEndDateKey = resolveOptionalDateKey(today, template.expectedEndDayOffset);
	const startDateTime = toISOFromDateKeyAndTime(startDateKey, template.startTime);
	const endDateTime = resolveOptionalDateTime(endDateKey, template.endTime);
	const expectedEndDateTime = resolveOptionalDateTime(expectedEndDateKey, template.expectedEndTime);
	const rangeEnd = firstDefined(endDateTime, expectedEndDateTime, startDateTime);

	return {
		absenceNoticeId: template.absenceNoticeId,
		attendanceTypeCode: template.attendanceTypeCode,
		attendanceTypeDescription: template.attendanceTypeDescription,
		startDateTime,
		endDateTime,
		expectedEndDateTime,
		createdDateTime: addDays(today, template.startDayOffset - 2).toISOString(),
		consecutiveDays: countSchoolDays(new Date(startDateTime), new Date(rangeEnd)),
		student: buildNoticeStudent(student),
		unit: UNIT,
		comment: template.comment,
		internalComment: template.internalComment,
		creator: template.creator,
		modifiedBy: null,
		lastModified: null,
		signals: [],
		attachment: null,
		links: buildNoticeLinks(student.externeId, template.absenceNoticeId),
		isRecurring: template.isRecurring,
	};
}
