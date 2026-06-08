'use client';

import { useMemo, useState } from 'react';
import ClickAvatarPreview from '@/components/ClickAvatarPreview';
import { SearchAndFiltersBar } from '@/components/SearchAndFiltersBar';
import { useStudentsContext } from '@/context/StudentsContext';
import { type SortColumn, type SortDirection, useStudentListFilters } from '@/hooks/useStudentListFilters';
import type { Student } from '@/magister/types';
import LessonHourBadge from './LessonHourBadge';
import StudentModal from './StudentModal';
import AgendaItemDisplay from './student/AgendaItemDisplay';

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
		if (sortColumn === column) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortColumn(column);
			setSortDirection('asc');
		}
	};

	const handleRowClick = (student: Student) => setSelectedStudent(student);
	const handleCloseModal = () => setSelectedStudent(null);

	const handleStudyFilterChange = (study: string, checked: boolean) => {
		setSelectedStudies((prev) => {
			const newSet = new Set(prev);
			if (checked) newSet.add(study);
			else newSet.delete(study);
			return newSet;
		});
	};

	const getSortIndicator = (column: SortColumn) =>
		sortColumn === column ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';

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
				<div className="overflow-x-auto border rounded-lg shadow-sm">
					<table className="min-w-full divide-y divide-border">
						<thead
							className="
								bg-muted
								text-xs
								font-medium
								text-muted-foreground
								uppercase
								tracking-wider
								text-center
								cursor-pointer
							"
						>
							<tr>
								<th className="text-center">
									{sortedStudents.length} van {filteredStudents.length}
								</th>
								<th scope="col" onClick={() => handleSort('naam')} className="px-6 py-3">
									Naam{getSortIndicator('naam')}
								</th>
								<th scope="col" onClick={() => handleSort('klas')}>
									Klas{getSortIndicator('klas')}
								</th>
								<th
									scope="col"
									className="px-6 py-3"
									onClick={() => handleSort('lockerCode')}
									title="Gebruik 'k:' voor kluisje"
								>
									Kluisje{getSortIndicator('lockerCode')}
								</th>
								<th scope="col" className="px-6 py-3 w-34" onClick={() => handleSort('now')}>
									<div className="flex items-center justify-center gap-1">
										{currentLessonInfo.lesson && <LessonHourBadge lessonInfo={currentLessonInfo} />}
										<span>{currentLessonInfo.range ?? 'Geen les'}</span>
									</div>
									{getSortIndicator('now')}
								</th>
								<th scope="col" className="px-6 py-3 w-34" onClick={() => handleSort('next')}>
									<div className="flex items-center justify-center gap-1">
										{nextLessonInfo.lesson && (
											<LessonHourBadge lessonInfo={nextLessonInfo} className="bg-primary/40" />
										)}
										<span>{nextLessonInfo.range ?? 'Geen les'}</span>
									</div>
									{getSortIndicator('next')}
								</th>
							</tr>
						</thead>
						<tbody className="bg-card divide-y divide-border">
							{sortedStudents.map((student) => (
								<tr
									key={student.id}
									className="hover:bg-muted cursor-pointer transition-colors"
									onClick={() => handleRowClick(student)}
								>
									<td className="px-6 py-4 whitespace-nowrap">
										<ClickAvatarPreview
											src={student.links.foto?.href || undefined}
											alt={`${student.roepnaam} ${student.achternaam}`}
											initials={`${student.roepnaam.charAt(0)}${student.achternaam.charAt(0)}`.toUpperCase()}
											className="h-14 w-14"
										/>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-card-foreground">
										{student.roepnaam} {student.tussenvoegsel} {student.achternaam}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
										{student.klassen.join(', ')}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
										{student.lockerCode || '-'}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground max-w-32">
										<AgendaItemDisplay type="current" studentId={student.id} />
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground max-w-32">
										<AgendaItemDisplay
											type="next"
											studentId={student.id}
											lessonRange={
												nextLessonInfo.status === 'lesson' ? nextLessonInfo.range : undefined
											}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{selectedStudent && <StudentModal student={selectedStudent} onClose={handleCloseModal} />}
		</div>
	);
}

export default Students;
