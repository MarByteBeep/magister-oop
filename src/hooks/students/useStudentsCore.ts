import { useState } from 'react';
import { useMagisterSession } from '@/context/MagisterSessionContext';
import { useLessonInfo } from '@/hooks/agenda/useLessonInfo';
import { useCurrentTime } from '@/hooks/shared/useCurrentTime';
import { useSelectedStudiesStorage } from '@/hooks/shared/useSelectedStudiesStorage';
import { useStudentFetch } from '@/hooks/students/useStudentFetch';
import { useStudentStore } from '@/hooks/students/useStudentStore';

/** Bundles the session/store/fetch hooks so {@link useStudents} stays under hook-density limits. */
export function useStudentsCore() {
	const session = useMagisterSession();
	const [students, setStudents] = useStudentStore();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const currentTime = useCurrentTime();
	const { currentLesson, nextLesson } = useLessonInfo(currentTime);
	const { selectedStudies, setSelectedStudies } = useSelectedStudiesStorage();
	const { fetchLockers, fetchStudentsPaginated, refresh: refetchStudents } = useStudentFetch(setStudents);

	return {
		session,
		students,
		setStudents,
		loading,
		setLoading,
		error,
		setError,
		currentLesson,
		nextLesson,
		selectedStudies,
		setSelectedStudies,
		fetchLockers,
		fetchStudentsPaginated,
		refetchStudents,
	};
}
