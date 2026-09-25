import { useEffect, useState } from 'react';
import { agendaEntriesForDate } from '@/lib/agendaLoadUtils';
import { getDateKey, getNow, getWorkWeekRange } from '@/lib/dateUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/types/student.types';
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
			const { start, end } = getWorkWeekRange(today);
			loadAgendaForStudent(studentId, start, end)
				.then(({ entries }) => {
					if (!cancelled) setAgendaEntries(agendaEntriesForDate(entries, todayKey));
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
