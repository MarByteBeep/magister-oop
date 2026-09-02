import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAgendaLoader } from '@/hooks/useAgendaLoader';
import { useAutoLoadAgenda } from '@/hooks/useAutoLoadAgenda';
import { needsAgendaDayFetch, repairStaleAgendaCache } from '@/lib/agendaLoadUtils';
import { findAgendaItemPreferringLessons, findNextAgendaItem } from '@/lib/agendaUtils';
import { getTodayKey } from '@/lib/dateUtils';
import { deepEqual } from '@/lib/utils';
import type { Student } from '@/magister/types';
import { useCurrentTime } from './useCurrentTime';
import { useLessonInfo } from './useLessonInfo';
import { useSelectedStudiesStorage } from './useSelectedStudiesStorage';
import { useStudentFetch } from './useStudentFetch';
import { mergeStudent, useStudentStorageSync } from './useStudentStorageSync';

export function useStudents() {
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const currentTime = useCurrentTime();

	const { currentLesson, nextLesson } = useLessonInfo(currentTime);
	const { selectedStudies, setSelectedStudies } = useSelectedStudiesStorage();
	const { loadStoredStudents } = useStudentStorageSync(students, setStudents);
	const { fetchLockers, fetchStudentsPaginated, refresh: refetchStudents } = useStudentFetch(setStudents);

	const loadAgendaForStudent = useAgendaLoader(setStudents);

	useEffect(() => {
		setStudents((prev) => {
			if (prev.length === 0) return prev;
			const repaired = prev.map(repairStaleAgendaCache);
			return deepEqual(prev, repaired) ? prev : repaired;
		});
	}, []);

	useEffect(() => {
		let cancelled = false;
		async function init() {
			setLoading(true);
			const stored = await loadStoredStudents();
			const storedById = new Map(stored.map((student) => [student.id, student]));
			if (cancelled) return;

			setStudents([]);
			await fetchStudentsPaginated().catch((err) => setError(err instanceof Error ? err.message : String(err)));
			if (cancelled) return;
			await fetchLockers().catch((err) => setError(err instanceof Error ? err.message : String(err)));
			if (cancelled) return;

			setStudents((prev) =>
				prev.map((student) => {
					const cached = storedById.get(student.id);
					if (!cached) return student;
					return repairStaleAgendaCache(
						mergeStudent(student, {
							agenda: cached.agenda,
							returnMeasuresLoadedFor: cached.returnMeasuresLoadedFor,
							lockerCode: cached.lockerCode,
						}),
					);
				}),
			);
			setLoading(false);
		}
		void init();
		return () => {
			cancelled = true;
		};
	}, [loadStoredStudents, fetchStudentsPaginated, fetchLockers]);

	useAutoLoadAgenda(students, selectedStudies, loadAgendaForStudent);

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
					? findAgendaItemPreferringLessons(currentTime, agendaForToday)
					: undefined,
				nextAgendaItem: agendaForToday ? findNextAgendaItem(currentTime, agendaForToday) : undefined,
			};
		});
	}, [students, currentTime]);

	const studentsNeedingAgendaCount = useMemo(() => {
		const todayKey = getTodayKey();
		const filtered = students.filter((student) =>
			selectedStudies.size ? student.studies.some((s) => selectedStudies.has(s)) : true,
		);
		return filtered.filter((s) => needsAgendaDayFetch(s, todayKey)).length;
	}, [students, selectedStudies]);

	return {
		students: studentsWithAgendaInfo,
		loading: loading || studentsNeedingAgendaCount > 0,
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
