import type { Student } from '@/magister/types';

export type StudentVisibility = (studentId: number) => boolean;

/**
 * Shared visibility rule for bulk lists that arrive before the students do.
 * A study selection is a positive filter, so students that are not loaded yet only pass
 * while no study is selected.
 */
export function createStudentVisibility(
	studentById: Map<number, Student>,
	selectedStudies: Set<string>,
): StudentVisibility {
	return (studentId) => {
		if (!selectedStudies.size) return true;
		const student = studentById.get(studentId);
		return student ? student.studies.some((study) => selectedStudies.has(study)) : false;
	};
}
