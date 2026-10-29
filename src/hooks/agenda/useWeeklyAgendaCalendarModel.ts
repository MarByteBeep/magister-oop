import { useMemo } from 'react';
import { useLoadAgendaForStudent } from '@/hooks/agenda/useLoadAgendaForStudent';
import { useStableAgendaEntries, useStableAgendaEntry } from '@/hooks/agenda/useStableAgendaEntries';
import { useWeeklyAgenda } from '@/hooks/agenda/useWeeklyAgenda';
import { useCurrentTime } from '@/hooks/shared/useCurrentTime';
import { useStudentById } from '@/hooks/students/useStudentById';
import { findActiveEntryPreferringLessons } from '@/lib/agenda/entryUtils';
import { getStartOfWeek } from '@/lib/shared/dateUtils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

function todayAgendaEntries(agenda: Record<string, AgendaEntry[]> | undefined, todayKey: string): AgendaEntry[] {
	if (!agenda) return [];
	const entries = agenda[todayKey];
	if (!entries) return [];
	return entries;
}

function activeEntryForCurrentWeek(isCurrentWeek: boolean, activeEntry: AgendaEntry | null): AgendaEntry | null {
	if (!isCurrentWeek) return null;
	return activeEntry;
}

export function useWeeklyAgendaCalendarModel(studentId: number, focusDate?: Date) {
	const currentTime = useCurrentTime();
	const loadAgendaForStudent = useLoadAgendaForStudent();
	const student = useStudentById(studentId);

	const weekly = useWeeklyAgenda(studentId, student, loadAgendaForStudent, focusDate);

	const activeEntry = useMemo(() => {
		const agenda = student ? student.agenda : undefined;
		const todayItems = todayAgendaEntries(agenda, weekly.todayKey);
		return findActiveEntryPreferringLessons(currentTime, todayItems);
	}, [currentTime, student, weekly.todayKey]);

	const stableEntries = useStableAgendaEntries(weekly.calendarItems);
	const stableActiveEntry = useStableAgendaEntry(activeEntryForCurrentWeek(weekly.isCurrentWeek, activeEntry));
	const calendarDate = useMemo(() => getStartOfWeek(weekly.selectedWeekDate), [weekly.selectedWeekDate]);

	return {
		...weekly,
		stableEntries,
		stableActiveEntry,
		calendarDate,
	};
}
