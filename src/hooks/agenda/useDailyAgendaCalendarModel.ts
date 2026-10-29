import { useMemo } from 'react';
import { useDailyAgendaBootstrap } from '@/hooks/agenda/useDailyAgendaBootstrap';
import { useLoadAgendaForStudent } from '@/hooks/agenda/useLoadAgendaForStudent';
import { useStableAgendaEntries, useStableAgendaEntry } from '@/hooks/agenda/useStableAgendaEntries';
import { useCurrentTime } from '@/hooks/shared/useCurrentTime';
import { useStudentById } from '@/hooks/students/useStudentById';
import { findActiveEntryPreferringLessons } from '@/lib/agenda/entryUtils';
import { getDateKey, getWorkWeekRange } from '@/lib/shared/dateUtils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

function agendaForDay(student: Student | undefined, todayKey: string): AgendaEntry[] | undefined {
	if (student === undefined) return undefined;
	const agenda = student.agenda;
	if (agenda === undefined) return undefined;
	return agenda[todayKey];
}

function resolveAgendaEntries(
	agendaFromContext: AgendaEntry[] | undefined,
	bootstrapAgenda: AgendaEntry[] | undefined,
): AgendaEntry[] | undefined {
	if (agendaFromContext !== undefined) return agendaFromContext;
	return bootstrapAgenda;
}

function entriesOrEmpty(agendaEntries: AgendaEntry[] | undefined): AgendaEntry[] {
	if (agendaEntries === undefined) return [];
	return agendaEntries;
}

export function useDailyAgendaCalendarModel(studentId: number) {
	const currentTime = useCurrentTime();
	const loadAgendaForStudent = useLoadAgendaForStudent();
	const student = useStudentById(studentId);
	const todayKey = useMemo(() => getDateKey(currentTime), [currentTime]);
	const workWeekStartKey = useMemo(() => getDateKey(getWorkWeekRange(currentTime).start), [currentTime]);
	const { bootstrapAgenda, isLoading } = useDailyAgendaBootstrap(
		student,
		todayKey,
		workWeekStartKey,
		loadAgendaForStudent,
	);
	const resolvedEntries = entriesOrEmpty(resolveAgendaEntries(agendaForDay(student, todayKey), bootstrapAgenda));
	const stableEntries = useStableAgendaEntries(resolvedEntries);
	const stableActiveEntry = useStableAgendaEntry(findActiveEntryPreferringLessons(currentTime, resolvedEntries));

	return { currentTime, isLoading, stableEntries, stableActiveEntry };
}
