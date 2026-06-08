import { useEffect, useMemo, useState } from 'react';
import { getNow } from '@/lib/dateUtils';
import { createLimiter } from '@/lib/limiter';
import type { UnauthorizedAbsencesResponse } from '@/magister/response/unauthorized-absence.types';
import type { Student } from '@/magister/types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

export function useAbsenceAgendaLoader(
	data: UnauthorizedAbsencesResponse | null,
	students: Student[],
	allowedStudentIds: Set<number>,
	todayKey: string,
	loadAgendaForStudent: LoadAgendaForStudentFn,
) {
	const agendaLimiter = useMemo(() => createLimiter(3, 150), []);
	const [agendaLoadedForStudentIds, setAgendaLoadedForStudentIds] = useState<Set<number>>(new Set());

	useEffect(() => {
		if (!data) return;

		const studentMap = new Map(students.map((s) => [s.id, s]));
		const ids = new Set<number>();
		for (const item of data.items ?? []) {
			const student = studentMap.get(item.id);
			if (!student) continue;
			if (!allowedStudentIds.has(student.id)) continue;
			if (student.agenda?.[todayKey]) continue;
			if (agendaLoadedForStudentIds.has(student.id)) continue;
			ids.add(student.id);
		}

		if (ids.size === 0) return;

		let cancelled = false;
		const now = getNow();

		void (async () => {
			await Promise.allSettled(
				Array.from(ids).map((id) =>
					agendaLimiter(async () => {
						if (cancelled) return;
						try {
							await loadAgendaForStudent(id, now, now);
						} finally {
							setAgendaLoadedForStudentIds((prev) => {
								const next = new Set(prev);
								next.add(id);
								return next;
							});
						}
					}),
				),
			);
		})();

		return () => {
			cancelled = true;
		};
	}, [data, allowedStudentIds, agendaLoadedForStudentIds, agendaLimiter, loadAgendaForStudent, students, todayKey]);
}
