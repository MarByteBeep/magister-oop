import { useEffect, useState } from 'react';
import { agendaEntriesForDate, isAgendaDayLoaded, needsAgendaRangeFetch } from '@/lib/agendaLoadUtils';
import { addDays, parseDateKey } from '@/lib/dateUtils';
import { studentDataStore } from '@/lib/studentDataStore';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/types/student.types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

export function useDailyAgendaBootstrap(
	student: Student | undefined,
	todayKey: string,
	workWeekStartKey: string,
	loadAgendaForStudent: LoadAgendaForStudentFn,
): { bootstrapAgenda: AgendaEntry[] | undefined; isLoading: boolean } {
	const [bootstrapAgenda, setBootstrapAgenda] = useState<AgendaEntry[] | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const weekStart = parseDateKey(workWeekStartKey);
		const weekEnd = addDays(weekStart, 4);

		if (!student) {
			setBootstrapAgenda(undefined);
			setIsLoading(false);
			return;
		}

		const studentAgenda = student.agenda;
		if (
			!needsAgendaRangeFetch(studentAgenda, weekStart, weekEnd, studentDataStore.getAbsenceNoticeLoad(student.id))
		) {
			setBootstrapAgenda(undefined);
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		setIsLoading(!isAgendaDayLoaded(studentAgenda, todayKey));
		loadAgendaForStudent(student.id, weekStart, weekEnd)
			.then(({ entries }) => {
				if (!cancelled) setBootstrapAgenda(agendaEntriesForDate(entries, todayKey));
			})
			.catch((err) => console.error('Failed to load agenda:', err))
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [student, todayKey, workWeekStartKey, loadAgendaForStudent]);

	return { bootstrapAgenda, isLoading };
}
