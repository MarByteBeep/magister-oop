import { useEffect, useState } from 'react';
import { useWeeklyAgendaLoader } from '@/hooks/useWeeklyAgendaLoader';
import { useWeeklyAgendaWeek } from '@/hooks/useWeeklyAgendaWeek';
import { getDateKey, parseDateKey, weekOffsetFromDate } from '@/lib/shared/dateUtils';
import type { Student } from '@/types/student.types';

export function useWeeklyAgenda(
	studentId: number,
	student: Student | undefined,
	loadAgendaForStudent: (id: number, start: Date, end: Date) => Promise<unknown>,
	focusDate?: Date,
) {
	const [isLoading, setIsLoading] = useState(false);
	const focusKey = focusDate ? getDateKey(focusDate) : null;
	const [weekOffset, setWeekOffset] = useState(() => (focusDate ? weekOffsetFromDate(focusDate) : 0));

	useEffect(() => {
		if (focusKey) setWeekOffset(weekOffsetFromDate(parseDateKey(focusKey)));
	}, [focusKey]);

	const week = useWeeklyAgendaWeek(weekOffset, student);
	useWeeklyAgendaLoader(studentId, week.weekKey, week.selectedWeekDate, student, loadAgendaForStudent, setIsLoading);

	return {
		isLoading,
		weekOffset,
		...week,
		goToPreviousWeek: () => setWeekOffset((prev) => prev - 1),
		goToNextWeek: () => setWeekOffset((prev) => prev + 1),
		goToCurrentWeek: () => setWeekOffset(0),
	};
}
