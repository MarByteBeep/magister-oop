'use client';

import { useMemo, useRef, useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';
import RegistrationCategoryFilter, {
	ALL_CATEGORIES,
	type RegistrationCategory,
} from '@/components/registrations/RegistrationCategoryFilter';
import RegistrationGroupList from '@/components/registrations/RegistrationGroupList';
import { useRegistrationsContext } from '@/context/RegistrationsContext';
import { useStudentsContext } from '@/context/StudentsContext';
import { useAllowedStudentIds } from '@/hooks/useAllowedStudentIds';
import { useGroupedRegistrations } from '@/hooks/useGroupedRegistrations';
import { useRegistrationsAgendaLoader } from '@/hooks/useRegistrationsAgendaLoader';
import { getTodayKey } from '@/lib/dateUtils';
import type { Student } from '@/magister/types';
import LoadingSpinner from './LoadingSpinner';
import StudentModal from './StudentModal';
import { Button } from './ui/button';

export default function Registrations() {
	const { data, loading, refreshing, error, refresh } = useRegistrationsContext();
	const { students, selectedStudies, loadAgendaForStudent } = useStudentsContext();
	const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
	const [category, setCategory] = useState<string>(ALL_CATEGORIES);

	const todayKey = getTodayKey();
	const allowedStudentIds = useAllowedStudentIds(students, selectedStudies);

	useRegistrationsAgendaLoader(data, students, allowedStudentIds, todayKey, loadAgendaForStudent);

	const selectedStudentRef = useRef<Student | undefined>(undefined);
	const selectedStudent: Student | undefined = useMemo(() => {
		if (selectedStudentId == null) {
			selectedStudentRef.current = undefined;
			return undefined;
		}
		const found = students.find((s) => s.id === selectedStudentId);
		if (!selectedStudentRef.current || selectedStudentRef.current.id !== selectedStudentId) {
			selectedStudentRef.current = found;
		}
		return selectedStudentRef.current;
	}, [selectedStudentId, students]);

	const grouped = useGroupedRegistrations(data, students, selectedStudies);

	const categories: RegistrationCategory[] = useMemo(
		() =>
			grouped.orderedReasons.map(({ key, label }) => ({
				key,
				label,
				count: grouped.byReason.get(key)?.length ?? 0,
			})),
		[grouped],
	);

	// A category can disappear when the data refreshes, so fall back to showing everything.
	const activeCategory = categories.some((c) => c.key === category) ? category : ALL_CATEGORIES;
	const visibleReasons =
		activeCategory === ALL_CATEGORIES
			? grouped.orderedReasons
			: grouped.orderedReasons.filter((reason) => reason.key === activeCategory);

	if (loading) {
		return (
			<div className="py-10">
				<LoadingSpinner />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center gap-2 py-10">
				<p className="text-sm text-destructive">Fout bij laden registraties: {error}</p>
				<Button onClick={refresh}>Opnieuw proberen</Button>
			</div>
		);
	}

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
