import { useEffect, useState } from 'react';
import { getDateKey, getNow } from '@/lib/dateUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/magister/types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

export function useTardyModalAgenda(
	isOpen: boolean,
	studentId: number | undefined,
	students: Student[],
	loadAgendaForStudent: LoadAgendaForStudentFn,
) {
	const [agendaEntries, setAgendaEntries] = useState<AgendaEntry[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!isOpen || !studentId) {
			setAgendaEntries([]);
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
				setAgendaEntries(agendaForToday);
				setIsLoading(false);
			}
		} else {
			setIsLoading(true);
			loadAgendaForStudent(studentId, today, today)
				.then(({ entries }) => {
					if (!cancelled) setAgendaEntries(entries);
				})
				.catch((err) => {
					if (!cancelled) {
						console.error('Failed to load agenda:', err);
						setAgendaEntries([]);
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

	return { agendaEntries, isLoading };
}
