import { useEffect, useRef } from 'react';
import { getDateKey, getStartOfWeek } from '@/lib/dateUtils';
import type { Student } from '@/magister/types';

export function useWeeklyAgendaLoader(
	studentId: number,
	weekKey: string,
	selectedWeekDate: Date,
	weekDays: Date[],
	student: Student | undefined,
	loadAgendaForStudent: (id: number, start: Date, end: Date) => Promise<unknown>,
	setIsLoading: (loading: boolean) => void,
) {
	const hasLoadedRef = useRef<Set<string>>(new Set());
	const studentRef = useRef(student);
	studentRef.current = student;

	const loadAgendaRef = useRef(loadAgendaForStudent);
	loadAgendaRef.current = loadAgendaForStudent;

	useEffect(() => {
		const loadKey = `${studentId}-${weekKey}`;
		if (hasLoadedRef.current.has(loadKey)) {
			setIsLoading(false);
			return;
		}

		const currentStudent = studentRef.current;
		if (!currentStudent) {
			setIsLoading(false);
			return;
		}

		const dataExists = weekDays.every((day) => currentStudent.agenda?.[getDateKey(day)] !== undefined);
		if (dataExists) {
			hasLoadedRef.current.add(loadKey);
			setIsLoading(false);
			return;
		}

		const monday = getStartOfWeek(selectedWeekDate);
		const friday = new Date(monday);
		friday.setDate(monday.getDate() + 4);

		hasLoadedRef.current.add(loadKey);
		setIsLoading(true);

		loadAgendaRef
			.current(currentStudent.id, monday, friday)
			.catch((err) => console.error('Failed to load week agenda:', err))
			.finally(() => setIsLoading(false));
	}, [studentId, weekKey, selectedWeekDate, weekDays, setIsLoading]);
}
