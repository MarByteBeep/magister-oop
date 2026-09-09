import { useMemo } from 'react';
import {
	type RegistrationRow,
	buildRegistrationRows,
	buildFilterPairs,
	buildOrderedReasons,
	sortRegistrationRows,
} from '@/lib/registrationsUtils';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';
import type { Student } from '@/magister/types';

export function useGroupedRegistrations(
	data: RegistrationsResponse | null,
	students: Student[],
	allowedStudentIds: Set<number>,
) {
	return useMemo(() => {
		const studentById = new Map(students.map((s) => [s.id, s]));

		if (!data) {
			return {
				orderedReasons: [] as { key: string; label: string }[],
				byReason: new Map<string, RegistrationRow[]>(),
				studentById,
			};
		}

		const filterPairs = buildFilterPairs(data);
		const byReason = buildRegistrationRows(data, studentById, allowedStudentIds, filterPairs);
		sortRegistrationRows(byReason);
		const orderedReasons = buildOrderedReasons(filterPairs, byReason);

		return { orderedReasons, byReason, studentById };
	}, [data, allowedStudentIds, students]);
}
