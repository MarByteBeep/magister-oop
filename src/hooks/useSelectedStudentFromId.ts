import { useMemo, useRef } from 'react';
import type { Student } from '@/types/student.types';

export function useSelectedStudentFromId(students: Student[], selectedStudentId: number | null): Student | undefined {
	const selectedStudentRef = useRef<Student | undefined>(undefined);

	return useMemo(() => {
		if (selectedStudentId == null) {
			selectedStudentRef.current = undefined;
			return undefined;
		}
		const found = students.find((s) => s.id === selectedStudentId);
		if (!selectedStudentRef.current || selectedStudentRef.current.id !== selectedStudentId) {
			selectedStudentRef.current = found;
		}
		return selectedStudentRef.current;
	}, [selectedStudentId, students]);
}
