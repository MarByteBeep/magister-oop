import { useCallback, useEffect, useState } from 'react';
import { findStudentOverviewEntry, findStudentOverviewEntryOverlappingLessonRange } from '@/lib/agendaEntryUtils';
import { agendaEntriesForDate, isAgendaDayLoaded } from '@/lib/agendaLoadUtils';
import { getDateKey, getNow, getWorkWeekRange } from '@/lib/dateUtils';
import { deepEqual } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/types/student.types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

export function useAgendaItemDisplay(
	student: Student | undefined,
	type: 'current' | 'next',
	lessonRange: string | undefined,
	loadAgendaForStudent: LoadAgendaForStudentFn,
) {
	const [agendaEntry, setAgendaEntry] = useState<AgendaEntry | null>(null);
	const [isLoadingAgenda, setIsLoadingAgenda] = useState(false);
	const [hasFetchedForToday, setHasFetchedForToday] = useState(false);

	const findRelevantAgendaEntry = useCallback(
		(entries: AgendaEntry[], date: Date) => {
			if (type === 'current') return findStudentOverviewEntry(date, entries);
			if (lessonRange) return findStudentOverviewEntryOverlappingLessonRange(entries, lessonRange);
			return null;
		},
		[type, lessonRange],
	);

	useEffect(() => {
		if (!student) return;

		const todayKey = getDateKey(getNow());

		const agenda = student.agenda;
		const agendaForToday = agenda?.[todayKey];
		if (isAgendaDayLoaded(agenda, todayKey)) {
			const nextEntry = findRelevantAgendaEntry(agendaForToday ?? [], getNow());
			setAgendaEntry((prev) => (prev && nextEntry && deepEqual(prev, nextEntry) ? prev : nextEntry));
			setHasFetchedForToday(true);
		} else {
			setAgendaEntry(null);
			setHasFetchedForToday(false);
		}
	}, [student, findRelevantAgendaEntry]);

	const handleSyncClick = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!student || isLoadingAgenda) return;

		setIsLoadingAgenda(true);
		try {
			const now = getNow();
			const { start, end } = getWorkWeekRange(now);
			const { entries } = await loadAgendaForStudent(student.id, start, end);
			setAgendaEntry(findRelevantAgendaEntry(agendaEntriesForDate(entries, getDateKey(now)), now));
			setHasFetchedForToday(true);
		} catch (error) {
			console.error('Failed to load agenda:', error);
		} finally {
			setIsLoadingAgenda(false);
		}
	};

	return { agendaEntry, isLoadingAgenda, hasFetchedForToday, handleSyncClick };
}
