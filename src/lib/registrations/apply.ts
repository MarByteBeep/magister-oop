import { replaceRegistrationEntries } from '@/lib/agenda/entryUtils';
import { registrationEntriesForStudent } from '@/lib/registrations/entries';
import { deepEqual } from '@/lib/utils';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';
import type { Student } from '@/types/student.types';
import type { StudentWrite } from '@/types/studentStore.types';

/** Replace today's registration overlays on students that already have an agenda for `dateKey`. */
export function applyRegistrationsToStudents(
	students: Student[],
	data: RegistrationsResponse,
	dateKey: string,
): StudentWrite[] {
	let changed = false;
	const next = students.map((student) => {
		const dayEntries = student.agenda?.[dateKey];
		if (dayEntries === undefined) return student;

		const updatedDay = replaceRegistrationEntries(dayEntries, registrationEntriesForStudent(data, student.id));
		if (deepEqual(dayEntries, updatedDay)) return student;

		changed = true;
		return {
			...student,
			agenda: { ...student.agenda, [dateKey]: updatedDay },
		};
	});
	return changed ? next : students;
}
