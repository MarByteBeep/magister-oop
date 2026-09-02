import { useEffect, useRef } from 'react';
import { isAgendaRangeLoaded, needsAgendaDayFetch } from '@/lib/agendaLoadUtils';
import { getDateKey, getStartOfWeek } from '@/lib/dateUtils';
import type { Student } from '@/magister/types';

export function useWeeklyAgendaLoader(
	studentId: number,
	weekKey: string,
	selectedWeekDate: Date,
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

		const monday = getStartOfWeek(selectedWeekDate);
		const friday = new Date(monday);
		friday.setDate(monday.getDate() + 4);

		const rangeNeedsFetch = Array.from({ length: 5 }, (_, index) => {
			const day = new Date(monday);
			day.setDate(monday.getDate() + index);
			return needsAgendaDayFetch(currentStudent, getDateKey(day));
		}).some(Boolean);

		const rangeComplete = !rangeNeedsFetch;
		if (rangeComplete) {
			hasLoadedRef.current.add(loadKey);
			setIsLoading(false);
			return;
		}

		hasLoadedRef.current.add(loadKey);
		setIsLoading(!isAgendaRangeLoaded(currentStudent, monday, friday));

		loadAgendaRef
			.current(currentStudent.id, monday, friday)
			.catch((err) => console.error('Failed to load week agenda:', err))
			.finally(() => setIsLoading(false));
	}, [studentId, weekKey, selectedWeekDate, setIsLoading]);
}
