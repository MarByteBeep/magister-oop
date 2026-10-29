import { useMemo, useRef } from 'react';
import type { Student } from '@/types/student.types';

function shouldReplaceSelectedRef(current: Student | undefined, selectedStudentId: number): boolean {
	if (!current) return true;
	return current.id !== selectedStudentId;
}

export function useSelectedStudentFromId(students: Student[], selectedStudentId: number | null): Student | undefined {
	const selectedStudentRef = useRef<Student | undefined>(undefined);

	return useMemo(() => {
		if (selectedStudentId === null) {
			selectedStudentRef.current = undefined;
			return undefined;
		}
		const found = students.find((s) => s.id === selectedStudentId);
		if (shouldReplaceSelectedRef(selectedStudentRef.current, selectedStudentId)) {
			selectedStudentRef.current = found;
		}
		return selectedStudentRef.current;
	}, [selectedStudentId, students]);
}
