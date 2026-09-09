import { addDays, getDateKey, getNow, toISOFromDateKeyAndTime } from '@/lib/dateUtils';
import type { AbsenceNotice, AbsenceNoticePerson } from '@/magister/response/absence-notice.types';
import type { StudentBase } from '@/magister/response/student.types';

export type StoredAbsenceNoticeTemplate = {
	absenceNoticeId: string;
	attendanceTypeCode: string;
	attendanceTypeDescription: string;
	startDayOffset: number;
	startTime: string;
	endDayOffset: number | null;
	endTime: string | null;
	expectedEndDayOffset: number | null;
	expectedEndTime: string | null;
	comment: string;
	internalComment: string;
	creator: AbsenceNoticePerson;
	isRecurring: boolean;
};

const UNIT = { id: 'af5e4311-d487-48e1-8b0f-519423e1e0ee', name: 'VP' };

function countSchoolDays(start: Date, end: Date): number {
	let count = 0;
	const current = new Date(start);
	current.setHours(0, 0, 0, 0);
	const last = new Date(end);
	last.setHours(0, 0, 0, 0);
	while (current <= last) {
		const weekday = current.getDay();
		if (weekday !== 0 && weekday !== 6) count++;
		current.setDate(current.getDate() + 1);
	}
	return Math.max(count, 1);
}

function studentNumber(student: StudentBase): number {
	const parsed = Number.parseInt(student.code, 10);
	return Number.isNaN(parsed) ? student.id : parsed;
}

export function expandAbsenceNoticeTemplates(
	templates: StoredAbsenceNoticeTemplate[],
	student: StudentBase,
): AbsenceNotice[] {
	const today = getNow();

	return templates.map((template) => {
		const startDateKey = getDateKey(addDays(today, template.startDayOffset));
		const endDateKey = template.endDayOffset == null ? null : getDateKey(addDays(today, template.endDayOffset));
		const expectedEndDateKey =
			template.expectedEndDayOffset == null ? null : getDateKey(addDays(today, template.expectedEndDayOffset));
		const startDateTime = toISOFromDateKeyAndTime(startDateKey, template.startTime);
		const endDateTime =
			endDateKey && template.endTime ? toISOFromDateKeyAndTime(endDateKey, template.endTime) : null;
		const expectedEndDateTime =
			expectedEndDateKey && template.expectedEndTime
				? toISOFromDateKeyAndTime(expectedEndDateKey, template.expectedEndTime)
				: null;
		const rangeEnd = endDateTime ?? expectedEndDateTime ?? startDateTime;

		return {
			absenceNoticeId: template.absenceNoticeId,
			attendanceTypeCode: template.attendanceTypeCode,
			attendanceTypeDescription: template.attendanceTypeDescription,
			startDateTime,
			endDateTime,
			expectedEndDateTime,
			createdDateTime: addDays(today, template.startDayOffset - 2).toISOString(),
			consecutiveDays: countSchoolDays(new Date(startDateTime), new Date(rangeEnd)),
			student: {
				id: student.externeId,
				firstName: student.roepnaam,
				lastName: student.achternaam,
				infix: student.tussenvoegsel ?? '',
				groups: student.klassen,
				studies: student.studies,
				zenId: student.id,
				studentNumber: studentNumber(student),
				hasPhoto: Boolean(student.links.foto),
			},
			unit: UNIT,
			comment: template.comment,
			internalComment: template.internalComment,
			creator: template.creator,
			modifiedBy: null,
			lastModified: null,
			signals: [],
			attachment: null,
			links: [
				{
					href: `https://attendance.magister.net/api/v2/student/${student.externeId}/absence-notices/${template.absenceNoticeId}`,
					rel: 'Modify',
					method: 'PUT',
				},
				{
					href: `https://attendance.magister.net/api/v2/student/${student.externeId}/absence-notices/${template.absenceNoticeId}`,
					rel: 'Withdraw',
					method: 'DELETE',
				},
				{
					href: '',
					rel: 'Patch',
					method: 'PATCH',
				},
			],
			isRecurring: template.isRecurring,
		};
	});
}
