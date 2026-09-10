import { useMemo } from 'react';
import {
	buildFilterPairs,
	buildOrderedReasons,
	buildRegistrationRows,
	type RegistrationRow,
	sortRegistrationRows,
} from '@/lib/registrationsUtils';
import { createStudentVisibility } from '@/lib/studentVisibility';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';
import type { Student } from '@/magister/types';

export function useGroupedRegistrations(
	data: RegistrationsResponse | null,
	students: Student[],
	selectedStudies: Set<string>,
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
		const isVisible = createStudentVisibility(studentById, selectedStudies);
		const byReason = buildRegistrationRows(data, isVisible, filterPairs);
		sortRegistrationRows(byReason);
		const orderedReasons = buildOrderedReasons(filterPairs, byReason);

		return { orderedReasons, byReason, studentById };
	}, [data, students, selectedStudies]);
}
