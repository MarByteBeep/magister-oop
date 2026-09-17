import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMagisterSession } from '@/context/MagisterSessionContext';
import { useAgendaLoader } from '@/hooks/useAgendaLoader';
import { useAutoLoadAgenda } from '@/hooks/useAutoLoadAgenda';
import { useBulkLists } from '@/hooks/useBulkLists';
import { findLessonEntryPreferringLessons, findNextLessonEntry } from '@/lib/agendaEntryUtils';
import { needsAgendaRangeFetch } from '@/lib/agendaLoadUtils';
import { getNow, getTodayKey, getWorkWeekRange } from '@/lib/dateUtils';
import type { Student } from '@/magister/types';
import { useCurrentTime } from './useCurrentTime';
import { useLessonInfo } from './useLessonInfo';
import { useSelectedStudiesStorage } from './useSelectedStudiesStorage';
import { useStudentFetch } from './useStudentFetch';
import { useStudentStorageSync } from './useStudentStorageSync';

const LOGIN_CANCELLED_MESSAGE = 'Inloggen op Magister is afgebroken. Klik opnieuw op het extensie-icoon.';

export function useStudents() {
	const session = useMagisterSession();
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const currentTime = useCurrentTime();

	const { currentLesson, nextLesson } = useLessonInfo(currentTime);
	const { selectedStudies, setSelectedStudies } = useSelectedStudiesStorage();
	const { loadStoredStudents } = useStudentStorageSync(students, setStudents);
	const { fetchLockers, fetchStudentsPaginated, refresh: refetchStudents } = useStudentFetch(setStudents);

	const loadAgendaForStudent = useAgendaLoader(setStudents, students);

	useEffect(() => {
		let cancelled = false;
		async function init() {
			setLoading(true);
			const stored = await loadStoredStudents();
			if (cancelled) return;

			setStudents(stored);

			if (session !== 'ready') {
				if (session === 'connecting') {
					setError(null);
				} else if (session === 'cancelled') {
					setError(LOGIN_CANCELLED_MESSAGE);
					setLoading(false);
				}
				return;
			}

			setError(null);
			await fetchStudentsPaginated().catch((err) => setError(err instanceof Error ? err.message : String(err)));
			if (cancelled) return;
			await fetchLockers().catch((err) => setError(err instanceof Error ? err.message : String(err)));
			if (cancelled) return;
			setLoading(false);
		}
		void init();
		return () => {
			cancelled = true;
		};
	}, [session, loadStoredStudents, fetchStudentsPaginated, fetchLockers]);

	useAutoLoadAgenda(session === 'ready' ? students : [], selectedStudies, loadAgendaForStudent);
	useBulkLists(setStudents, session === 'ready');

	const refresh = useCallback(async () => {
		setLoading(true);
		await refetchStudents();
		setLoading(false);
	}, [refetchStudents]);

	const studentsWithAgendaInfo = useMemo(() => {
		const todayKey = getTodayKey();
		return students.map((student) => {
			const agendaForToday = student.agenda?.[todayKey];
			return {
				...student,
				currentAgendaItem: agendaForToday
					? (findLessonEntryPreferringLessons(currentTime, agendaForToday)?.item ?? null)
					: undefined,
				nextAgendaItem: agendaForToday
					? (findNextLessonEntry(currentTime, agendaForToday)?.item ?? null)
					: undefined,
			};
		});
	}, [students, currentTime]);

	const studentsNeedingAgendaCount = useMemo(() => {
		const { start, end } = getWorkWeekRange(getNow());
		const filtered = students.filter((student) =>
			selectedStudies.size ? student.studies.some((s) => selectedStudies.has(s)) : true,
		);
		return filtered.filter((s) => needsAgendaRangeFetch(s, start, end)).length;
	}, [students, selectedStudies]);

	return {
		students: studentsWithAgendaInfo,
		loading: session === 'connecting' || loading || studentsNeedingAgendaCount > 0,
		studentsNeedingAgendaCount,
		error,
		refresh,
		selectedStudies,
		setSelectedStudies,
		loadAgendaForStudent,
		currentLessonInfo: currentLesson,
		nextLessonInfo: nextLesson,
	};
}
