'use client';

import { useMemo, useState } from 'react';
import { SearchAndFiltersBar } from '@/components/SearchAndFiltersBar';
import StudentsTable from '@/components/StudentsTable';
import { useStudentsContext } from '@/context/StudentsContext';
import { useCurrentTime } from '@/hooks/shared/useCurrentTime';
import { type SortColumn, type SortDirection, useStudentListFilters } from '@/hooks/students/useStudentListFilters';
import { studentsLoadingTooltip } from '@/lib/students/loadingTooltip';
import type { Student } from '@/types/student.types';
import StudentModal from './StudentModal';

const STUDENTS_SEARCH_TERM_STORAGE_KEY = 'studentsSearchTerm';

function useStudentsSortState() {
	const [sortColumn, setSortColumn] = useState<SortColumn>('name');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

	const handleSort = (column: SortColumn) => {
		if (sortColumn === column) {
			setSortDirection(['desc', 'asc'][Number(sortDirection === 'asc')] as SortDirection);
			return;
		}
		setSortColumn(column);
		setSortDirection('asc');
	};

	return { sortColumn, sortDirection, handleSort };
}

function StudentsError({ error }: { error: string | null }) {
	if (!error) return null;
	return <p className="text-red-500">Fout bij het laden van leerlingen: {error}</p>;
}

function StudentsEmpty({ show }: { show: boolean }) {
	if (!show) return null;
	return <p>Geen leerlingen gevonden.</p>;
}

function StudentsTableSection({
	sortedStudents,
	filteredCount,
	sortColumn,
	sortDirection,
	currentLessonInfo,
	nextLessonInfo,
	onSort,
	onRowClick,
}: {
	sortedStudents: Student[];
	filteredCount: number;
	sortColumn: SortColumn;
	sortDirection: SortDirection;
	currentLessonInfo: ReturnType<typeof useStudentsContext>['currentLessonInfo'];
	nextLessonInfo: ReturnType<typeof useStudentsContext>['nextLessonInfo'];
	onSort: (column: SortColumn) => void;
	onRowClick: (student: Student) => void;
}) {
	if (sortedStudents.length === 0) return null;

	return (
		<StudentsTable
			sortedStudents={sortedStudents}
			filteredCount={filteredCount}
			sortColumn={sortColumn}
			sortDirection={sortDirection}
			currentLessonInfo={currentLessonInfo}
			nextLessonInfo={nextLessonInfo}
			onSort={onSort}
			onRowClick={onRowClick}
		/>
	);
}

function SelectedStudentModal({ student, onClose }: { student: Student | null; onClose: () => void }) {
	if (!student) return null;
	return <StudentModal student={student} onClose={onClose} />;
}

function useStudentsPageState() {
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
	const currentTime = useCurrentTime();
	const [searchTerm, setSearchTerm] = useState('');
	const { sortColumn, sortDirection, handleSort } = useStudentsSortState();
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
	const [activeQuickFilterId, setActiveQuickFilterId] = useState<string | null>(null);

	const { uniqueStudies, filteredStudents, sortedStudents } = useStudentListFilters(
		students,
		selectedStudies,
		searchTerm,
		sortColumn,
		sortDirection,
		currentTime,
	);

	const permanentFilterOptions = useMemo(
		() => uniqueStudies.map((study) => ({ value: study, label: study })),
		[uniqueStudies],
	);

	const handleStudyFilterChange = (study: string, checked: boolean) => {
		setSelectedStudies((prev) => {
			const newSet = new Set(prev);
			if (checked) newSet.add(study);
			else newSet.delete(study);
			return newSet;
		});
	};

	return {
		loading,
		error,
		selectedStudies,
		currentLessonInfo,
		nextLessonInfo,
		searchTerm,
		setSearchTerm,
		sortColumn,
		sortDirection,
		handleSort,
		selectedStudent,
		setSelectedStudent,
		activeQuickFilterId,
		setActiveQuickFilterId,
		filteredStudents,
		sortedStudents,
		permanentFilterOptions,
		handleStudyFilterChange,
		loadingTooltip: studentsLoadingTooltip(studentsNeedingAgendaCount),
		showEmpty: isStudentsListEmpty(sortedStudents.length, loading, error),
	};
}

function isStudentsListEmpty(count: number, loading: boolean, error: string | null): boolean {
	if (count > 0) return false;
	if (loading) return false;
	return error === null;
}

function Students() {
	const page = useStudentsPageState();

	return (
		<div className="w-full">
			<div className="mb-4">
				<SearchAndFiltersBar
					searchTerm={page.searchTerm}
					onSearchTermChange={page.setSearchTerm}
					searchPlaceholder="Zoek op naam, klas, kluisje of huidige les..."
					searchStorageKey={STUDENTS_SEARCH_TERM_STORAGE_KEY}
					permanentFilterOptions={page.permanentFilterOptions}
					selectedPermanentFilters={page.selectedStudies}
					onSelectedPermanentFiltersChange={page.handleStudyFilterChange}
					quickFilters={[]}
					activeQuickFilterId={page.activeQuickFilterId}
					onActiveQuickFilterIdChange={page.setActiveQuickFilterId}
					loading={page.loading}
					loadingTooltip={page.loadingTooltip}
				/>
			</div>

			<StudentsError error={page.error} />
			<StudentsEmpty show={page.showEmpty} />
			<StudentsTableSection
				sortedStudents={page.sortedStudents}
				filteredCount={page.filteredStudents.length}
				sortColumn={page.sortColumn}
				sortDirection={page.sortDirection}
				currentLessonInfo={page.currentLessonInfo}
				nextLessonInfo={page.nextLessonInfo}
				onSort={page.handleSort}
				onRowClick={page.setSelectedStudent}
			/>
			<SelectedStudentModal student={page.selectedStudent} onClose={() => page.setSelectedStudent(null)} />
		</div>
	);
}

export default Students;
