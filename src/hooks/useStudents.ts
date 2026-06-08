import mergeOriginal, { type Options } from 'deepmerge';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAgendaLoader } from '@/hooks/useAgendaLoader';
import { useAutoLoadAgenda } from '@/hooks/useAutoLoadAgenda';
import { findAgendaItem, findNextAgendaItem, getLesson, getNextLesson, type LessonInfo } from '@/lib/agendaUtils';
import { getTodayKey } from '@/lib/dateUtils';
import { storage, syncFromChrome } from '@/lib/storage';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { LockersResponse } from '@/magister/response/locker.types';
import type { StudentsResponse } from '@/magister/response/student.types';
import type { Student } from '@/magister/types';
import { useCurrentTime } from './useCurrentTime';

const deepEqual = <T>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

function merge<T>(target: T, source: Partial<T>, options?: Options): T {
	return mergeOriginal(target, source, {
		arrayMerge: (_, sourceArray) => sourceArray,
		...options,
	});
}

const studentsStorageKey = 'students';
const selectedStudiesStorageKey = 'selectedStudies';

export function useStudents() {
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedStudies, setSelectedStudies] = useState<Set<string>>(new Set());
	const [initializedStudies, setInitializedStudies] = useState(false);
	const currentTime = useCurrentTime();

	// Flag to prevent storage listener from processing our own writes (race condition fix)
	const isWritingStudentsToStorage = useRef(false);

	// Lesson info
	const [currentLesson, setCurrentLesson] = useState<LessonInfo>(() => getLesson(currentTime));
	const [nextLesson, setNextLesson] = useState<LessonInfo>(() => getNextLesson(currentLesson));

	useEffect(() => {
		const newCurrent = getLesson(currentTime);
		const newNext = getNextLesson(newCurrent);

		if (!deepEqual(newCurrent, currentLesson)) setCurrentLesson(newCurrent);
		if (!deepEqual(newNext, nextLesson)) setNextLesson(newNext);
	}, [currentTime, currentLesson, nextLesson]);

	// ---- Storage ----
	const loadStoredStudents = useCallback(async () => {
		const arr = await storage.session.get<Student[]>(studentsStorageKey);
		return arr ?? [];
	}, []);

	useEffect(() => {
		if (students.length) {
			isWritingStudentsToStorage.current = true;
			void storage.session.set(studentsStorageKey, students).then(() => {
				// Reset flag after a short delay to allow async storage event to pass
				setTimeout(() => {
					isWritingStudentsToStorage.current = false;
				}, 50);
			});
		}
	}, [students]);

	const loadAgendaForStudent = useAgendaLoader(setStudents);

	// ---- Fetch lockers ----
	const fetchLockers = useCallback(async () => {
		try {
			const data: LockersResponse = await getJson<LockersResponse>(endpoints.lockers(), 'omit');

			setStudents((prev) => {
				const newStudents = prev.map((s) => {
					const locker = data.lockersDetails.find((l) => l.rentalPeriod?.student?.personId === s.id);
					return locker ? merge(s, { lockerCode: locker.lockerCode }) : s;
				});
				return newStudents;
			});
		} catch (e) {
			console.error(e);
		}
	}, []);

	// ---- Fetch students incrementally ----
	const fetchStudentsPaginated = useCallback(async () => {
		let nextUrl: string | null = endpoints.searchStudents(50, 0);

		while (nextUrl) {
			const data: StudentsResponse = await getJson<StudentsResponse>(nextUrl);
			setStudents((prev) => {
				const merged = [...prev];
				for (const s of data.items) {
					const idx = merged.findIndex((st) => st.id === s.id);
					if (idx >= 0) {
						merged[idx] = merge(merged[idx], s);
					} else {
						merged.push(s);
					}
				}
				return merged;
			});

			nextUrl = data.links.next?.href ?? null;
		}
	}, []);

	// ---- Initial load ----
	useEffect(() => {
		let cancelled = false;
		async function init() {
			setLoading(true);

			const stored = await loadStoredStudents();
			if (cancelled) return;
			setStudents(stored);

			await fetchStudentsPaginated().catch((err) => setError(err instanceof Error ? err.message : String(err)));
			if (cancelled) return;
			await fetchLockers().catch((err) => setError(err instanceof Error ? err.message : String(err)));

			setLoading(false);
		}

		void init();
		return () => {
			cancelled = true;
		};
	}, [loadStoredStudents, fetchStudentsPaginated, fetchLockers]);

	// ---- Auto-load today's agendas ----
	useAutoLoadAgenda(students, selectedStudies, loadAgendaForStudent);

	// ---- selectedStudies (local storage) ----
	useEffect(() => {
		(async () => {
			const arr = await storage.local.get<string[]>(selectedStudiesStorageKey);
			setSelectedStudies(new Set(arr ?? []));
			setInitializedStudies(true);
		})();
	}, []);

	useEffect(() => {
		if (!initializedStudies) return;
		void storage.local.set(selectedStudiesStorageKey, Array.from(selectedStudies));
	}, [selectedStudies, initializedStudies]);

	// ---- external storage listener ----
	useEffect(() => {
		if (!chrome?.storage) return;

		const onSessionStudents = syncFromChrome<Student[]>('session', studentsStorageKey, (arr) => {
			// Skip processing our own writes to prevent race condition flickering
			if (isWritingStudentsToStorage.current) return;

			setStudents((prev) => {
				const updated = arr ?? [];
				return deepEqual(prev, updated) ? prev : updated;
			});
		});

		const onLocalSelectedStudies = syncFromChrome<string[]>('local', selectedStudiesStorageKey, (arr) =>
			setSelectedStudies(new Set(arr)),
		);

		chrome.storage.onChanged.addListener(onSessionStudents);
		chrome.storage.onChanged.addListener(onLocalSelectedStudies);

		return () => {
			chrome.storage.onChanged.removeListener(onSessionStudents);
			chrome.storage.onChanged.removeListener(onLocalSelectedStudies);
		};
	}, []);

	const refresh = useCallback(async () => {
		setLoading(true);
		setStudents([]);
		await Promise.all([fetchStudentsPaginated(), fetchLockers()]);
		setLoading(false);
	}, [fetchStudentsPaginated, fetchLockers]);

	// ---- students with agenda info ----
	const studentsWithAgendaInfo = useMemo(() => {
		const todayKey = getTodayKey();
		return students.map((student) => {
			const agendaForToday = student.agenda?.[todayKey];
			return {
				...student,
				currentAgendaItem: agendaForToday ? findAgendaItem(currentTime, agendaForToday) : undefined,
				nextAgendaItem: agendaForToday ? findNextAgendaItem(currentTime, agendaForToday) : undefined,
			};
		});
	}, [students, currentTime]);

	// Check how many students still need agendas (for loading indicator)
	const studentsNeedingAgendaCount = useMemo(() => {
		const todayKey = getTodayKey();
		const filtered = students.filter((student) =>
			selectedStudies.size ? student.studies.some((s) => selectedStudies.has(s)) : true,
		);
		return filtered.filter((s) => s.agenda?.[todayKey] === undefined).length;
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
