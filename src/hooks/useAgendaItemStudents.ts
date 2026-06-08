import { useMemo } from 'react';
import { agendaItemOverlapsLesson } from '@/lib/agendaUtils';
import { formatTime, getDateKey } from '@/lib/dateUtils';
import { formatLocation } from '@/lib/locationUtils';
import { sortAndGroupStudentsByClass } from '@/lib/utils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';

export function useAgendaItemStudents(item: AgendaItem, students: Student[]) {
	const beginTime = new Date(item.begin);
	const endTime = new Date(item.einde);
	const dateKey = getDateKey(beginTime);
	const lessonStart = formatTime(beginTime);
	const lessonEnd = formatTime(endTime);
	const firstLocationCode = formatLocation(item.locaties[0]) ?? '';
	const hasLocation = firstLocationCode !== '';

	const studentsInLocation = useMemo(() => {
		if (!hasLocation) return {};

		const studentsFound: Student[] = [];
		for (const student of students) {
			const agendaForDay = student.agenda?.[dateKey];
			if (!agendaForDay) continue;

			for (const agendaItem of agendaForDay) {
				if (!agendaItemOverlapsLesson(agendaItem, lessonStart, lessonEnd)) continue;
				const itemLocations = agendaItem.locaties.map((loc) => formatLocation(loc)).filter(Boolean);
				if (itemLocations.includes(firstLocationCode)) {
					studentsFound.push(student);
					break;
				}
			}
		}
		return sortAndGroupStudentsByClass(studentsFound);
	}, [students, dateKey, firstLocationCode, lessonStart, lessonEnd, hasLocation]);

	return { beginTime, endTime, lessonStart, lessonEnd, hasLocation, studentsInLocation };
}
