import { useState } from 'react';
import type { Student } from '@/magister/types';
import { useWeeklyAgendaLoader } from './useWeeklyAgendaLoader';
import { useWeeklyAgendaWeek } from './useWeeklyAgendaWeek';

export function useWeeklyAgenda(
	studentId: number,
	student: Student | undefined,
	loadAgendaForStudent: (id: number, start: Date, end: Date) => Promise<unknown>,
) {
	const [isLoading, setIsLoading] = useState(false);
	const [weekOffset, setWeekOffset] = useState(0);

	const week = useWeeklyAgendaWeek(weekOffset, student);
	useWeeklyAgendaLoader(
		studentId,
		week.weekKey,
		week.selectedWeekDate,
		week.weekDays,
		student,
		loadAgendaForStudent,
		setIsLoading,
	);

	return {
		isLoading,
		weekOffset,
		...week,
		goToPreviousWeek: () => setWeekOffset((prev) => prev - 1),
		goToNextWeek: () => setWeekOffset((prev) => prev + 1),
		goToCurrentWeek: () => setWeekOffset(0),
	};
}
