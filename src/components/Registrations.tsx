'use client';

import { useState } from 'react';
import { asyncFetchStatus } from '@/components/AsyncFetchStatus';
import RegistrationCategoryFilter from '@/components/registrations/RegistrationCategoryFilter';
import RegistrationGroupList from '@/components/registrations/RegistrationGroupList';
import SyncButton from '@/components/SyncButton';
import { useRegistrationsContext } from '@/context/RegistrationsContext';
import { useStudentsContext } from '@/context/StudentsContext';
import { useGroupedRegistrations } from '@/hooks/registrations/useGroupedRegistrations';
import { useRegistrationCategories } from '@/hooks/registrations/useRegistrationCategories';
import { useRegistrationsAgendaLoader } from '@/hooks/registrations/useRegistrationsAgendaLoader';
import { useAllowedStudentIds } from '@/hooks/students/useAllowedStudentIds';
import { useSelectedStudentFromId } from '@/hooks/students/useSelectedStudentFromId';
import { ALL_REGISTRATION_CATEGORIES } from '@/lib/registrations/categories';
import { getTodayKey } from '@/lib/shared/dateUtils';
import StudentModal from './StudentModal';

export default function Registrations() {
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

	const fetchStatus = asyncFetchStatus({
		loading,
		error,
		errorMessage: 'Fout bij laden registraties',
		onRetry: refresh,
	});
	if (fetchStatus) return fetchStatus;

	if (!data) {
		return <p className="text-sm text-muted-foreground">Geen data.</p>;
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between gap-2">
				<RegistrationCategoryFilter value={activeCategory} categories={categories} onChange={setCategory} />
				<SyncButton
					kind="plain"
					label="Ververs registraties"
					busy={refreshing}
					toast="Registraties gesynchroniseerd"
					errorToast="Registraties synchroniseren mislukt"
					onSync={refresh}
				/>
			</div>

			<RegistrationGroupList
				orderedReasons={visibleReasons}
				byReason={grouped.byReason}
				studentById={grouped.studentById}
				onSelectStudent={setSelectedStudentId}
			/>

			{selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudentId(null)} />}
		</div>
	);
}
