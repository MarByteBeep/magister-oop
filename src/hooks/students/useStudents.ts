import { useCallback } from 'react';
import { useAgendaLoader } from '@/hooks/agenda/useAgendaLoader';
import { useStudentsCore } from '@/hooks/students/useStudentsCore';
import { useStudentsNeedingAgendaCount } from '@/hooks/students/useStudentsNeedingAgendaCount';
import { useStudentsSideEffects } from '@/hooks/students/useStudentsSideEffects';
import { registerLoadAgendaForStudent } from '@/lib/agenda/loadForStudentRegistry';

function studentsLoadingFlag(loading: boolean, studentsNeedingAgendaCount: number): boolean {
	if (loading) return true;
	return studentsNeedingAgendaCount > 0;
}

export function useStudents() {
	const core = useStudentsCore();
	const loadAgendaForStudent = useAgendaLoader(core.setStudents, core.students);
	registerLoadAgendaForStudent(loadAgendaForStudent);

	useStudentsSideEffects(
		core.session,
		core.students,
		core.selectedStudies,
		loadAgendaForStudent,
		core.setStudents,
		core.fetchStudentsPaginated,
		core.fetchLockers,
		core.setLoading,
		core.setError,
	);

	const refresh = useCallback(async () => {
		core.setLoading(true);
		await core.refetchStudents();
		core.setLoading(false);
	}, [core.setLoading, core.refetchStudents]);

	const studentsNeedingAgendaCount = useStudentsNeedingAgendaCount(core.students, core.selectedStudies);

	return {
		students: core.students,
		loading: studentsLoadingFlag(core.loading, studentsNeedingAgendaCount),
		studentsNeedingAgendaCount,
		error: core.error,
		refresh,
		selectedStudies: core.selectedStudies,
		setSelectedStudies: core.setSelectedStudies,
		loadAgendaForStudent,
		currentLessonInfo: core.currentLesson,
		nextLessonInfo: core.nextLesson,
	};
}
