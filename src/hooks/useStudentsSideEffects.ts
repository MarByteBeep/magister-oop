import type { Dispatch, SetStateAction } from 'react';
import { useAutoLoadAgenda } from '@/hooks/useAutoLoadAgenda';
import { useBulkLists } from '@/hooks/useBulkLists';
import { useStudentsInit } from '@/hooks/useStudentsInit';
import type { MagisterSessionStatus } from '@/lib/magisterSession';
import type { Student } from '@/types/student.types';
import type { StudentWrite } from '@/types/studentStore.types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

export function useStudentsSideEffects(
	session: MagisterSessionStatus,
	students: Student[],
	selectedStudies: Set<string>,
	loadAgendaForStudent: LoadAgendaForStudentFn,
	setStudents: Dispatch<SetStateAction<StudentWrite[]>>,
	fetchStudentsPaginated: () => Promise<void>,
	fetchLockers: () => Promise<void>,
	setLoading: (loading: boolean) => void,
	setError: (error: string | null) => void,
) {
	useStudentsInit(session, fetchStudentsPaginated, fetchLockers, setLoading, setError);

	const ready = session === 'ready';
	useAutoLoadAgenda(ready ? students : [], selectedStudies, loadAgendaForStudent);
	useBulkLists(setStudents, ready);
}
