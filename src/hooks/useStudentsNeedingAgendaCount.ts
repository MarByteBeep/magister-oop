import { useMemo } from 'react';
import { needsAgendaRangeFetch } from '@/lib/agenda/loadUtils';
import { getNow, getWorkWeekRange } from '@/lib/shared/dateUtils';
import { studentDataStore } from '@/lib/students/dataStore';
import type { Student } from '@/types/student.types';

export function useStudentsNeedingAgendaCount(students: Student[], selectedStudies: Set<string>): number {
	return useMemo(() => {
		const { start, end } = getWorkWeekRange(getNow());
		const filtered = students.filter((student) =>
			selectedStudies.size ? student.studies.some((s) => selectedStudies.has(s)) : true,
		);
		return filtered.filter((s) =>
			needsAgendaRangeFetch(s.agenda, start, end, studentDataStore.getAbsenceNoticeLoad(s.id)),
		).length;
	}, [students, selectedStudies]);
}
