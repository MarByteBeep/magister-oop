import { useMemo } from 'react';
import type { Student } from '@/magister/types';

export function useAllowedStudentIds(students: Student[], selectedStudies: Set<string>) {
	return useMemo(() => {
		if (!selectedStudies.size) {
			return new Set(students.map((s) => s.id));
		}
		return new Set(students.filter((s) => s.studies.some((st) => selectedStudies.has(st))).map((s) => s.id));
	}, [students, selectedStudies]);
}
