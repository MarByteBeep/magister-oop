import { useCallback, useEffect, useState } from 'react';
import { findStudentOverviewEntry, findStudentOverviewEntryOverlappingLessonRange } from '@/lib/agendaEntryUtils';
import { isAgendaDayLoaded } from '@/lib/agendaLoadUtils';
import { getDateKey, getNow } from '@/lib/dateUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/magister/types';
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

		if (isAgendaDayLoaded(student, todayKey)) {
			setAgendaEntry(findRelevantAgendaEntry(student.agenda?.[todayKey] ?? [], getNow()));
			setHasFetchedForToday(true);
		} else {
			setAgendaEntry(null);
			setHasFetchedForToday(false);
		}
	}, [student?.agenda, student, findRelevantAgendaEntry]);

	const handleSyncClick = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!student || isLoadingAgenda) return;

		setIsLoadingAgenda(true);
		try {
			const now = getNow();
			const { entries } = await loadAgendaForStudent(student.id, now, now);
			setAgendaEntry(findRelevantAgendaEntry(entries, now));
			setHasFetchedForToday(true);
		} catch (error) {
			console.error('Failed to load agenda:', error);
		} finally {
			setIsLoadingAgenda(false);
		}
	};

	return { agendaEntry, isLoadingAgenda, hasFetchedForToday, handleSyncClick };
}
