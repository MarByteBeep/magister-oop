import { useMemo } from 'react';
import { findStudentsInAgendaLocation, resolveAgendaItemLocation } from '@/lib/agendaItemStudents';
import { formatTime, getDateKey } from '@/lib/dateUtils';
import { sortAndGroupStudentsByClass } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/types/student.types';

export function useAgendaItemStudents(entry: AgendaEntry, students: Student[]) {
	const beginTime = new Date(entry.start);
	const endTime = new Date(entry.end);
	const dateKey = getDateKey(beginTime);
	const lessonStart = formatTime(beginTime);
	const lessonEnd = formatTime(endTime);
	const { firstLocation, hasLocation } = resolveAgendaItemLocation(entry);

	const studentsInLocation = useMemo(() => {
		if (!hasLocation || entry.kind !== 'lesson') return {};
		return sortAndGroupStudentsByClass(
			findStudentsInAgendaLocation(students, dateKey, firstLocation, lessonStart, lessonEnd),
		);
	}, [students, dateKey, firstLocation, lessonStart, lessonEnd, hasLocation, entry.kind]);

	return { beginTime, endTime, lessonStart, lessonEnd, hasLocation, studentsInLocation };
}
