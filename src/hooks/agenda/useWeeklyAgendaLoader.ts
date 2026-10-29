import { useEffect, useRef } from 'react';
import { isAgendaRangeLoaded, needsAgendaDayFetch } from '@/lib/agenda/loadUtils';
import { getDateKey, getStartOfWeek } from '@/lib/shared/dateUtils';
import { studentDataStore } from '@/lib/students/dataStore';
import type { Student } from '@/types/student.types';

function weekRangeNeedsFetch(student: Student, monday: Date): boolean {
	const studentAgenda = student.agenda;
	const absenceNoticeLoad = studentDataStore.getAbsenceNoticeLoad(student.id);
	return Array.from({ length: 5 }, (_, index) => {
		const day = new Date(monday);
		day.setDate(monday.getDate() + index);
		return needsAgendaDayFetch(studentAgenda, getDateKey(day), absenceNoticeLoad);
	}).some(Boolean);
}

function fridayFromMonday(monday: Date): Date {
	const friday = new Date(monday);
	friday.setDate(monday.getDate() + 4);
	return friday;
}

function finishWithoutFetch(hasLoadedRef: Set<string>, loadKey: string, setIsLoading: (loading: boolean) => void) {
	hasLoadedRef.add(loadKey);
	setIsLoading(false);
}

function startAgendaFetch(
	student: Student,
	monday: Date,
	friday: Date,
	loadAgenda: (id: number, start: Date, end: Date) => Promise<unknown>,
	setIsLoading: (loading: boolean) => void,
) {
	setIsLoading(!isAgendaRangeLoaded(student.agenda, monday, friday));
	loadAgenda(student.id, monday, friday)
		.catch(() => {
			// useAgendaLoader already logs real failures.
		})
		.finally(() => setIsLoading(false));
}

function skipLoadIfAlreadyDone(
	hasLoadedRef: Set<string>,
	loadKey: string,
	setIsLoading: (loading: boolean) => void,
): boolean {
	if (!hasLoadedRef.has(loadKey)) return false;
	setIsLoading(false);
	return true;
}

function skipLoadIfNoStudent(
	student: Student | undefined,
	setIsLoading: (loading: boolean) => void,
): student is undefined {
	if (student) return false;
	setIsLoading(false);
	return true;
}

function tryLoadOrMarkComplete(
	student: Student,
	selectedWeekDate: Date,
	hasLoadedRef: Set<string>,
	loadKey: string,
	loadAgenda: (id: number, start: Date, end: Date) => Promise<unknown>,
	setIsLoading: (loading: boolean) => void,
) {
	const monday = getStartOfWeek(selectedWeekDate);
	if (!weekRangeNeedsFetch(student, monday)) {
		finishWithoutFetch(hasLoadedRef, loadKey, setIsLoading);
		return;
	}
	hasLoadedRef.add(loadKey);
	startAgendaFetch(student, monday, fridayFromMonday(monday), loadAgenda, setIsLoading);
}

function loadWeeklyAgendaIfNeeded(
	studentId: number,
	weekKey: string,
	selectedWeekDate: Date,
	student: Student | undefined,
	hasLoadedRef: Set<string>,
	loadAgenda: (id: number, start: Date, end: Date) => Promise<unknown>,
	setIsLoading: (loading: boolean) => void,
) {
	const loadKey = `${studentId}-${weekKey}`;
	if (skipLoadIfAlreadyDone(hasLoadedRef, loadKey, setIsLoading)) return;
	if (skipLoadIfNoStudent(student, setIsLoading)) return;
	tryLoadOrMarkComplete(student, selectedWeekDate, hasLoadedRef, loadKey, loadAgenda, setIsLoading);
}

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
		loadWeeklyAgendaIfNeeded(
			studentId,
			weekKey,
			selectedWeekDate,
			studentRef.current,
			hasLoadedRef.current,
			loadAgendaRef.current,
			setIsLoading,
		);
	}, [studentId, weekKey, selectedWeekDate, setIsLoading]);
}
