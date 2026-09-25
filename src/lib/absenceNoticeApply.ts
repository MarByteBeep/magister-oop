import { noticesForStudent } from '@/lib/absenceNoticeUtils';
import { replaceAbsenceNoticeEntries } from '@/lib/agendaEntryUtils';
import { deepEqual } from '@/lib/utils';
import type { AbsenceNotice } from '@/magister/response/absence-notice.types';
import type { Student } from '@/types/student.types';
import type { StudentWrite } from '@/types/studentStore.types';

/** Replace today's absence overlays on students that already have an agenda for `dateKey`. */
export function applyAbsenceNoticesToStudents(
	students: Student[],
	notices: AbsenceNotice[],
	dateKey: string,
): StudentWrite[] {
	let changed = false;
	const next = students.map((student) => {
		const dayEntries = student.agenda?.[dateKey];
		if (dayEntries === undefined) return student;

		const updatedDay = replaceAbsenceNoticeEntries(
			dayEntries,
			noticesForStudent(notices, student.externeId),
			dateKey,
		);
		if (deepEqual(dayEntries, updatedDay)) return student;

		changed = true;
		return {
			...student,
			agenda: { ...student.agenda, [dateKey]: updatedDay },
		};
	});
	return changed ? next : students;
}
