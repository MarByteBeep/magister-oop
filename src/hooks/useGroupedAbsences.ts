import { useMemo } from 'react';
import {
	type AbsenceRow,
	buildAbsenceRows,
	buildFilterPairs,
	buildOrderedReasons,
	sortAbsenceRows,
} from '@/lib/absenceUtils';
import type { UnauthorizedAbsencesResponse } from '@/magister/response/unauthorized-absence.types';
import type { Student } from '@/magister/types';

export function useGroupedAbsences(
	data: UnauthorizedAbsencesResponse | null,
	students: Student[],
	allowedStudentIds: Set<number>,
) {
	return useMemo(() => {
		const studentById = new Map(students.map((s) => [s.id, s]));

		if (!data) {
			return {
				orderedReasons: [] as { key: string; label: string }[],
				byReason: new Map<string, AbsenceRow[]>(),
				studentById,
			};
		}

		const filterPairs = buildFilterPairs(data);
		const byReason = buildAbsenceRows(data, studentById, allowedStudentIds, filterPairs);
		sortAbsenceRows(byReason);
		const orderedReasons = buildOrderedReasons(filterPairs, byReason);

		return { orderedReasons, byReason, studentById };
	}, [data, allowedStudentIds, students]);
}
