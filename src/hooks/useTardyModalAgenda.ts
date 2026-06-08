import { useEffect, useState } from 'react';
import { getDateKey, getNow } from '@/lib/dateUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';

export function useTardyModalAgenda(
	isOpen: boolean,
	studentId: number | undefined,
	students: Student[],
	loadAgendaForStudent: (id: number, start: Date, end: Date) => Promise<{ items: AgendaItem[] }>,
) {
	const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!isOpen || !studentId) {
			setAgendaItems([]);
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		const today = getNow();
		const todayKey = getDateKey(today);
		const studentFromContext = students.find((s) => s.id === studentId);
		const agendaForToday = studentFromContext?.agenda?.[todayKey];

		if (agendaForToday) {
			if (!cancelled) {
				setAgendaItems(agendaForToday);
				setIsLoading(false);
			}
		} else {
			setIsLoading(true);
			loadAgendaForStudent(studentId, today, today)
				.then(({ items }) => {
					if (!cancelled) setAgendaItems(items);
				})
				.catch((err) => {
					if (!cancelled) {
						console.error('Failed to load agenda:', err);
						setAgendaItems([]);
					}
				})
				.finally(() => {
					if (!cancelled) setIsLoading(false);
				});
		}

		return () => {
			cancelled = true;
		};
	}, [isOpen, studentId, students, loadAgendaForStudent]);

	return { agendaItems, isLoading };
}
