import { useCallback, useMemo } from 'react';
import { agendaItemOverlapsLesson, getItemLocationCodes } from '@/lib/agendaUtils';
import { sortAndGroupStudentsByClass } from '@/lib/utils';
import type { AttendanceStaffMember } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';

export function useOccupancyStudentsModalData(
	students: Student[],
	dateKey: string,
	lessonRange: string,
	locationCode: string,
) {
	const [lessonStart, lessonEnd] = lessonRange.split('-');
	const normalizedLocationCode = locationCode.trim().toLowerCase();

	const matchingAgendaItems = useCallback(
		(agendaForDay: NonNullable<Student['agenda']>[string]) =>
			agendaForDay.filter(
				(item) =>
					agendaItemOverlapsLesson(item, lessonStart, lessonEnd) &&
					getItemLocationCodes(item).includes(normalizedLocationCode),
			),
		[lessonStart, lessonEnd, normalizedLocationCode],
	);

	const studentsInLocation = useMemo(() => {
		const studentsFound: Student[] = [];
		for (const student of students) {
			const agendaForDay = student.agenda?.[dateKey];
			if (agendaForDay && matchingAgendaItems(agendaForDay).length > 0) {
				studentsFound.push(student);
			}
		}
		return sortAndGroupStudentsByClass(studentsFound);
	}, [students, dateKey, matchingAgendaItems]);

	const uniqueTeachers = useMemo(() => {
		const teachersMap = new Map<number, AttendanceStaffMember>();
		for (const student of students) {
			const agendaForDay = student.agenda?.[dateKey];
			if (!agendaForDay) continue;
			for (const item of matchingAgendaItems(agendaForDay)) {
				for (const teacher of item.deelnames.filter((p) => p.type === 'medewerker')) {
					teachersMap.set(teacher.id, teacher as AttendanceStaffMember);
				}
			}
		}
		return Array.from(teachersMap.values()).sort((a, b) => a.achternaam.localeCompare(b.achternaam));
	}, [students, dateKey, matchingAgendaItems]);

	const uniqueSubjects = useMemo(() => {
		const subjects = new Set<string>();
		for (const student of students) {
			const agendaForDay = student.agenda?.[dateKey];
			if (!agendaForDay) continue;
			for (const item of matchingAgendaItems(agendaForDay)) {
				for (const vak of item.vakken) {
					if (vak.omschrijving) subjects.add(vak.omschrijving);
				}
			}
		}
		return Array.from(subjects).sort();
	}, [students, dateKey, matchingAgendaItems]);

	return { studentsInLocation, uniqueTeachers, uniqueSubjects };
}
