'use client';

import { useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';
import { asyncFetchStatus } from '@/components/AsyncFetchStatus';
import RegistrationCategoryFilter from '@/components/registrations/RegistrationCategoryFilter';
import RegistrationGroupList from '@/components/registrations/RegistrationGroupList';
import { useRegistrationsContext } from '@/context/RegistrationsContext';
import { useStudentsContext } from '@/context/StudentsContext';
import { useAllowedStudentIds } from '@/hooks/useAllowedStudentIds';
import { useGroupedRegistrations } from '@/hooks/useGroupedRegistrations';
import { useRegistrationCategories } from '@/hooks/useRegistrationCategories';
import { useRegistrationsAgendaLoader } from '@/hooks/useRegistrationsAgendaLoader';
import { useSelectedStudentFromId } from '@/hooks/useSelectedStudentFromId';
import { getTodayKey } from '@/lib/dateUtils';
import { ALL_REGISTRATION_CATEGORIES } from '@/lib/registrationCategories';
import StudentModal from './StudentModal';
import { Button } from './ui/button';

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
				<Button
					variant="ghost"
					size="icon"
					onClick={refresh}
					disabled={refreshing}
					aria-label="Ververs registraties"
					title="Ververs"
				>
					<LuRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
				</Button>
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
