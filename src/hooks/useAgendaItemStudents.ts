import { useMemo } from 'react';
import { isLessonEntry } from '@/lib/agendaEntryUtils';
import { agendaItemOverlapsLesson } from '@/lib/agendaUtils';
import { formatTime, getDateKey } from '@/lib/dateUtils';
import { formatLocation } from '@/lib/locationUtils';
import { sortAndGroupStudentsByClass } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/magister/types';

export function useAgendaItemStudents(entry: AgendaEntry, students: Student[]) {
	const beginTime = new Date(entry.start);
	const endTime = new Date(entry.end);
	const dateKey = getDateKey(beginTime);
	const lessonStart = formatTime(beginTime);
	const lessonEnd = formatTime(endTime);
	const firstLocation = entry.kind === 'lesson' ? (formatLocation(entry.item.locaties[0]) ?? '') : '';
	const hasLocation = firstLocation !== '';

	const studentsInLocation = useMemo(() => {
		if (!hasLocation || entry.kind !== 'lesson') return {};

		const studentsFound: Student[] = [];
		for (const student of students) {
			const agendaForDay = student.agenda?.[dateKey];
			if (!agendaForDay) continue;

			for (const dayEntry of agendaForDay) {
				if (!isLessonEntry(dayEntry)) continue;
				if (!agendaItemOverlapsLesson(dayEntry.item, lessonStart, lessonEnd)) continue;
				const itemLocations = dayEntry.item.locaties.map((loc) => formatLocation(loc)).filter(Boolean);
				if (itemLocations.includes(firstLocation)) {
					studentsFound.push(student);
					break;
				}
			}
		}
		return sortAndGroupStudentsByClass(studentsFound);
	}, [students, dateKey, firstLocation, lessonStart, lessonEnd, hasLocation, entry.kind]);

	return { beginTime, endTime, lessonStart, lessonEnd, hasLocation, studentsInLocation };
}
