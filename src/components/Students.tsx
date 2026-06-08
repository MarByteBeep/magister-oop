'use client';

import { useMemo, useState } from 'react';
import { SearchAndFiltersBar } from '@/components/SearchAndFiltersBar';
import StudentsTable from '@/components/StudentsTable';
import { useStudentsContext } from '@/context/StudentsContext';
import { type SortColumn, type SortDirection, useStudentListFilters } from '@/hooks/useStudentListFilters';
import type { Student } from '@/magister/types';
import StudentModal from './StudentModal';

const STUDENTS_SEARCH_TERM_STORAGE_KEY = 'studentsSearchTerm';

function Students() {
	const {
		students,
		loading,
		studentsNeedingAgendaCount,
		error,
		selectedStudies,
		setSelectedStudies,
		currentLessonInfo,
		nextLessonInfo,
	} = useStudentsContext();
	const [searchTerm, setSearchTerm] = useState('');
	const [sortColumn, setSortColumn] = useState<SortColumn>('naam');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
	const [activeQuickFilterId, setActiveQuickFilterId] = useState<string | null>(null);

	const { uniqueStudies, filteredStudents, sortedStudents } = useStudentListFilters(
		students,
		selectedStudies,
		searchTerm,
		sortColumn,
		sortDirection,
	);

	const handleSort = (column: SortColumn) => {
		if (sortColumn === column) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		else {
			setSortColumn(column);
			setSortDirection('asc');
		}
	};

	const handleStudyFilterChange = (study: string, checked: boolean) => {
		setSelectedStudies((prev) => {
			const newSet = new Set(prev);
			if (checked) newSet.add(study);
			else newSet.delete(study);
			return newSet;
		});
	};

	const permanentFilterOptions = useMemo(
		() => uniqueStudies.map((study) => ({ value: study, label: study })),
		[uniqueStudies],
	);

	const loadingTooltip =
		studentsNeedingAgendaCount > 0 ? `${studentsNeedingAgendaCount} leerlingen nog te laden` : 'Laden...';

	return (
		<div className="w-full">
			<div className="mb-4">
				<SearchAndFiltersBar
					searchTerm={searchTerm}
					onSearchTermChange={setSearchTerm}
					searchPlaceholder="Zoek op naam, klas, kluisje of huidige les..."
					searchStorageKey={STUDENTS_SEARCH_TERM_STORAGE_KEY}
					permanentFilterOptions={permanentFilterOptions}
					selectedPermanentFilters={selectedStudies}
					onSelectedPermanentFiltersChange={handleStudyFilterChange}
					quickFilters={[]}
					activeQuickFilterId={activeQuickFilterId}
					onActiveQuickFilterIdChange={setActiveQuickFilterId}
					loading={loading}
					loadingTooltip={loadingTooltip}
				/>
			</div>

			{error && <p className="text-red-500">Fout bij het laden van leerlingen: {error}</p>}
			{sortedStudents.length === 0 && !loading && !error && <p>Geen leerlingen gevonden.</p>}

			{sortedStudents.length > 0 && (
				<StudentsTable
					sortedStudents={sortedStudents}
					filteredCount={filteredStudents.length}
					sortColumn={sortColumn}
					sortDirection={sortDirection}
					currentLessonInfo={currentLessonInfo}
					nextLessonInfo={nextLessonInfo}
					onSort={handleSort}
					onRowClick={setSelectedStudent}
				/>
			)}

			{selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
		</div>
	);
}

export default Students;
