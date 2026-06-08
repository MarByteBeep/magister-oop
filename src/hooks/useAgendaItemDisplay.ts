import { useCallback, useEffect, useState } from 'react';
import { findAgendaItem, findAgendaItemOverlappingLessonRange } from '@/lib/agendaUtils';
import { getDateKey, getNow } from '@/lib/dateUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';

export function useAgendaItemDisplay(
	student: Student | undefined,
	type: 'current' | 'next',
	lessonRange: string | undefined,
	loadAgendaForStudent: (id: number, start: Date, end: Date) => Promise<{ items: AgendaItem[] }>,
) {
	const [agendaItem, setAgendaItem] = useState<AgendaItem | null>(null);
	const [isLoadingAgenda, setIsLoadingAgenda] = useState(false);
	const [hasFetchedForToday, setHasFetchedForToday] = useState(false);

	const findRelevantAgendaItem = useCallback(
		(items: AgendaItem[], date: Date) => {
			if (type === 'current') return findAgendaItem(date, items);
			if (lessonRange) return findAgendaItemOverlappingLessonRange(items, lessonRange);
			return null;
		},
		[type, lessonRange],
	);

	useEffect(() => {
		if (!student) return;

		const todayKey = getDateKey(getNow());
		const agendaForToday = student.agenda?.[todayKey];

		if (agendaForToday !== undefined) {
			setAgendaItem(findRelevantAgendaItem(agendaForToday, getNow()));
			setHasFetchedForToday(true);
		} else {
			setAgendaItem(null);
			setHasFetchedForToday(false);
		}
	}, [student?.agenda, student, findRelevantAgendaItem]);

	const handleSyncClick = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!student || isLoadingAgenda) return;

		setIsLoadingAgenda(true);
		try {
			const now = getNow();
			const { items } = await loadAgendaForStudent(student.id, now, now);
			setAgendaItem(findRelevantAgendaItem(items, now));
			setHasFetchedForToday(true);
		} catch (error) {
			console.error('Failed to load agenda:', error);
		} finally {
			setIsLoadingAgenda(false);
		}
	};

	return { agendaItem, isLoadingAgenda, hasFetchedForToday, handleSyncClick };
}
