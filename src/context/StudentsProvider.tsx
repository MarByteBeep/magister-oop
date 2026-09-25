import { type ReactNode, useMemo } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { StudentsActionsContext, StudentsDataContext } from './StudentsContext';

interface Props {
	children: ReactNode;
}

export function StudentsProvider({ children }: Props) {
	const {
		students,
		loading,
		studentsNeedingAgendaCount,
		error,
		refresh,
		selectedStudies,
		setSelectedStudies,
		loadAgendaForStudent,
		currentLessonInfo,
		nextLessonInfo,
	} = useStudents();

	const actions = useMemo(
		() => ({ loadAgendaForStudent, refresh, setSelectedStudies }),
		[loadAgendaForStudent, refresh, setSelectedStudies],
	);

	const data = useMemo(
		() => ({
			students,
			loading,
			studentsNeedingAgendaCount,
			error,
			selectedStudies,
			currentLessonInfo,
			nextLessonInfo,
		}),
		[students, loading, studentsNeedingAgendaCount, error, selectedStudies, currentLessonInfo, nextLessonInfo],
	);

	return (
		<StudentsActionsContext.Provider value={actions}>
			<StudentsDataContext.Provider value={data}>{children}</StudentsDataContext.Provider>
		</StudentsActionsContext.Provider>
	);
}
