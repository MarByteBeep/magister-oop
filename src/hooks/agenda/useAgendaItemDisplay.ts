import { useCallback, useEffect, useState } from 'react';
import { findStudentOverviewEntry, findStudentOverviewEntryOverlappingLessonRange } from '@/lib/agenda/entryUtils';
import { agendaEntriesForDate, isAgendaDayLoaded } from '@/lib/agenda/loadUtils';
import { getDateKey, getNow, getWorkWeekRange } from '@/lib/shared/dateUtils';
import { deepEqual } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

function findRelevantAgendaEntry(
	type: 'current' | 'next',
	lessonRange: string | undefined,
	entries: AgendaEntry[],
	date: Date,
): AgendaEntry | null {
	if (type === 'current') return findStudentOverviewEntry(date, entries);
	if (lessonRange) return findStudentOverviewEntryOverlappingLessonRange(entries, lessonRange);
	return null;
}

function sameAgendaEntry(prev: AgendaEntry | null, nextEntry: AgendaEntry | null): boolean {
	if (!prev) return false;
	if (!nextEntry) return false;
	return deepEqual(prev, nextEntry);
}

function stableAgendaEntry(prev: AgendaEntry | null, nextEntry: AgendaEntry | null): AgendaEntry | null {
	if (sameAgendaEntry(prev, nextEntry)) return prev;
	return nextEntry;
}

function applyLoadedAgendaDay(
	agenda: Student['agenda'],
	todayKey: string,
	type: 'current' | 'next',
	lessonRange: string | undefined,
	setAgendaEntry: React.Dispatch<React.SetStateAction<AgendaEntry | null>>,
	setHasFetchedForToday: (value: boolean) => void,
) {
	const agendaForToday = agenda?.[todayKey];
	const nextEntry = findRelevantAgendaEntry(type, lessonRange, agendaForToday ?? [], getNow());
	setAgendaEntry((prev) => stableAgendaEntry(prev, nextEntry));
	setHasFetchedForToday(true);
}

function syncAgendaEntryFromStudent(
	student: Student | undefined,
	type: 'current' | 'next',
	lessonRange: string | undefined,
	setAgendaEntry: React.Dispatch<React.SetStateAction<AgendaEntry | null>>,
	setHasFetchedForToday: (value: boolean) => void,
) {
	if (!student) return;
	const todayKey = getDateKey(getNow());
	const agenda = student.agenda;
	if (isAgendaDayLoaded(agenda, todayKey)) {
		applyLoadedAgendaDay(agenda, todayKey, type, lessonRange, setAgendaEntry, setHasFetchedForToday);
		return;
	}
	setAgendaEntry(null);
	setHasFetchedForToday(false);
}

async function loadAndSetAgendaEntry(
	student: Student,
	type: 'current' | 'next',
	lessonRange: string | undefined,
	loadAgendaForStudent: LoadAgendaForStudentFn,
	setAgendaEntry: (entry: AgendaEntry | null) => void,
	setHasFetchedForToday: (value: boolean) => void,
) {
	try {
		const now = getNow();
		const { start, end } = getWorkWeekRange(now);
		const { entries } = await loadAgendaForStudent(student.id, start, end);
		setAgendaEntry(findRelevantAgendaEntry(type, lessonRange, agendaEntriesForDate(entries, getDateKey(now)), now));
		setHasFetchedForToday(true);
	} catch {
		// useAgendaLoader already logs real failures.
	}
}

export function useAgendaItemDisplay(
	student: Student | undefined,
	type: 'current' | 'next',
	lessonRange: string | undefined,
	loadAgendaForStudent: LoadAgendaForStudentFn,
) {
	const [agendaEntry, setAgendaEntry] = useState<AgendaEntry | null>(null);
	const [isLoadingAgenda, setIsLoadingAgenda] = useState(false);
	const [hasFetchedForToday, setHasFetchedForToday] = useState(false);

	useEffect(() => {
		syncAgendaEntryFromStudent(student, type, lessonRange, setAgendaEntry, setHasFetchedForToday);
	}, [student, type, lessonRange]);

	const handleSyncClick = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation();
			if (!student) return;
			if (isLoadingAgenda) return;
			setIsLoadingAgenda(true);
			await loadAndSetAgendaEntry(
				student,
				type,
				lessonRange,
				loadAgendaForStudent,
				setAgendaEntry,
				setHasFetchedForToday,
			).finally(() => setIsLoadingAgenda(false));
		},
		[student, isLoadingAgenda, type, lessonRange, loadAgendaForStudent],
	);

	return { agendaEntry, isLoadingAgenda, hasFetchedForToday, handleSyncClick };
}
