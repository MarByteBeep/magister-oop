import { useCallback, useState } from 'react';
import { useMagisterSession } from '@/context/MagisterSessionContext';
import { useAgendaLoader } from '@/hooks/agenda/useAgendaLoader';
import { useLessonInfo } from '@/hooks/agenda/useLessonInfo';
import { useCurrentTime } from '@/hooks/shared/useCurrentTime';
import { useSelectedStudiesStorage } from '@/hooks/shared/useSelectedStudiesStorage';
import { useStudentFetch } from '@/hooks/students/useStudentFetch';
import { useStudentStore } from '@/hooks/students/useStudentStore';
import { useStudentsNeedingAgendaCount } from '@/hooks/students/useStudentsNeedingAgendaCount';
import { useStudentsSideEffects } from '@/hooks/students/useStudentsSideEffects';
import { registerLoadAgendaForStudent } from '@/lib/agenda/loadForStudentRegistry';
import { isStudentsLoading } from '@/lib/students/loadingState';

export function useStudents() {
	const session = useMagisterSession();
	const [students, setStudents] = useStudentStore();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const currentTime = useCurrentTime();

	const { currentLesson, nextLesson } = useLessonInfo(currentTime);
	const { selectedStudies, setSelectedStudies } = useSelectedStudiesStorage();
	const { fetchLockers, fetchStudentsPaginated, refresh: refetchStudents } = useStudentFetch(setStudents);

	const loadAgendaForStudent = useAgendaLoader(setStudents, students);
	registerLoadAgendaForStudent(loadAgendaForStudent);

	useStudentsSideEffects(
		session,
		students,
		selectedStudies,
		loadAgendaForStudent,
		setStudents,
		fetchStudentsPaginated,
		fetchLockers,
		setLoading,
		setError,
	);

	const refresh = useCallback(async () => {
		setLoading(true);
		await refetchStudents();
		setLoading(false);
	}, [refetchStudents]);

	const studentsNeedingAgendaCount = useStudentsNeedingAgendaCount(students, selectedStudies);

	return {
		students,
		loading: isStudentsLoading(session, loading, studentsNeedingAgendaCount),
		studentsNeedingAgendaCount,
		error,
		refresh,
		selectedStudies,
		setSelectedStudies,
		loadAgendaForStudent,
		currentLessonInfo: currentLesson,
		nextLessonInfo: nextLesson,
	};
}
