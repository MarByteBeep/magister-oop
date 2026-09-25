import { useCallback, useState } from 'react';
import { useMagisterSession } from '@/context/MagisterSessionContext';
import { useAgendaLoader } from '@/hooks/useAgendaLoader';
import { useStudentStore } from '@/hooks/useStudentStore';
import { useStudentsNeedingAgendaCount } from '@/hooks/useStudentsNeedingAgendaCount';
import { useStudentsSideEffects } from '@/hooks/useStudentsSideEffects';
import { registerLoadAgendaForStudent } from '@/lib/loadAgendaForStudentRegistry';
import { isStudentsLoading } from '@/lib/studentsLoadingState';
import { useCurrentTime } from './useCurrentTime';
import { useLessonInfo } from './useLessonInfo';
import { useSelectedStudiesStorage } from './useSelectedStudiesStorage';
import { useStudentFetch } from './useStudentFetch';

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
