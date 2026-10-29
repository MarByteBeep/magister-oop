import { useState } from 'react';
import { useRegistrationsContext } from '@/context/RegistrationsContext';
import { useStudentsContext } from '@/context/StudentsContext';
import { useGroupedRegistrations } from '@/hooks/registrations/useGroupedRegistrations';
import { useRegistrationCategories } from '@/hooks/registrations/useRegistrationCategories';
import { useRegistrationsAgendaLoader } from '@/hooks/registrations/useRegistrationsAgendaLoader';
import { useAllowedStudentIds } from '@/hooks/students/useAllowedStudentIds';
import { useSelectedStudentFromId } from '@/hooks/students/useSelectedStudentFromId';
import { ALL_REGISTRATION_CATEGORIES } from '@/lib/registrations/categories';
import { getTodayKey } from '@/lib/shared/dateUtils';

export function useRegistrationsViewModel() {
	const { data, loading, refreshing, error, refresh } = useRegistrationsContext();
	const { students, selectedStudies, loadAgendaForStudent } = useStudentsContext();
	const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
	const [category, setCategory] = useState<string>(ALL_REGISTRATION_CATEGORIES);

	const todayKey = getTodayKey();
	const allowedStudentIds = useAllowedStudentIds(students, selectedStudies);

	useRegistrationsAgendaLoader(data, students, allowedStudentIds, todayKey, loadAgendaForStudent);

	const selectedStudent = useSelectedStudentFromId(students, selectedStudentId);
	const grouped = useGroupedRegistrations(data, students, selectedStudies);
	const { categories, activeCategory, visibleReasons } = useRegistrationCategories(grouped, category);

	return {
		data,
		loading,
		refreshing,
		error,
		refresh,
		selectedStudent,
		setSelectedStudentId,
		category,
		setCategory,
		categories,
		activeCategory,
		visibleReasons,
		grouped,
	};
}
