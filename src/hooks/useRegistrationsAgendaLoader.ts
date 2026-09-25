import { useEffect, useMemo, useState } from 'react';
import { needsAgendaDayFetch } from '@/lib/agendaLoadUtils';
import { getNow, getWorkWeekRange } from '@/lib/dateUtils';
import { createLimiter } from '@/lib/limiter';
import { studentDataStore } from '@/lib/studentDataStore';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';
import type { Student } from '@/types/student.types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

export function useRegistrationsAgendaLoader(
	data: RegistrationsResponse | null,
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
			if (!needsAgendaDayFetch(student.agenda, todayKey, studentDataStore.getAbsenceNoticeLoad(student.id))) {
				continue;
			}
			if (agendaLoadedForStudentIds.has(student.id)) continue;
			ids.add(student.id);
		}

		if (ids.size === 0) return;

		let cancelled = false;
		const { start, end } = getWorkWeekRange(getNow());

		void (async () => {
			await Promise.allSettled(
				Array.from(ids).map((id) =>
					agendaLimiter(async () => {
						if (cancelled) return;
						try {
							await loadAgendaForStudent(id, start, end);
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
