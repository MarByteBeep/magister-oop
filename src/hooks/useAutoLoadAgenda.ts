import { useEffect, useRef } from 'react';
import { getDateKey, getNow } from '@/lib/dateUtils';
import type { Student } from '@/magister/types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

function useLatest<T>(value: T) {
	const ref = useRef(value);
	ref.current = value;
	return ref;
}

export function useAutoLoadAgenda(
	students: Student[],
	selectedStudies: Set<string>,
	loadAgendaForStudent: LoadAgendaForStudentFn,
) {
	const studentsRef = useLatest(students);
	const selectedStudiesRef = useLatest(selectedStudies);
	const loadAgendaRef = useLatest(loadAgendaForStudent);

	// biome-ignore lint/correctness/useExhaustiveDependencies: refs are intentionally not dependencies
	useEffect(() => {
		const interval = setInterval(
			() => {
				const filtered = studentsRef.current.filter((student) =>
					selectedStudiesRef.current.size
						? student.studies.some((s) => selectedStudiesRef.current.has(s))
						: true,
				);
				const now = getNow();
				const todayKey = getDateKey(now);
				const student = filtered.find((s) => !s.agenda?.[todayKey]);

				if (student) {
					loadAgendaRef.current(student.id, now, now).catch((err) => {
						console.error(`Failed to auto-refresh agenda for student ${student.id}`, err);
					});
				}
			},
			Math.random() * 1000 + 1000,
		);

		return () => clearInterval(interval);
	}, []);
}
