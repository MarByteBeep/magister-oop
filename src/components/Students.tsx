'use client';

import { useMemo, useState } from 'react';
import ClickAvatarPreview from '@/components/ClickAvatarPreview';
import { SearchAndFiltersBar } from '@/components/SearchAndFiltersBar';
import { useStudentsContext } from '@/context/StudentsContext';
import { normalizeString } from '@/lib/stringUtils';
import type { AttendanceStaffMember } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';
import LessonHourBadge from './LessonHourBadge';
import StudentModal from './StudentModal';
import AgendaItemDisplay from './student/AgendaItemDisplay';

type SortColumn = 'naam' | 'klas' | 'lockerCode' | 'now' | 'next';
type SortDirection = 'asc' | 'desc';

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

	const uniqueStudies = useMemo(() => {
		const studies = new Set(students.flatMap((s) => s.studies));
		return Array.from(studies).sort();
	}, [students]);

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

	const filteredStudents = students.filter((student) =>
		selectedStudies.size ? student.studies.some((s) => selectedStudies.has(s)) : true,
	);

	const matchedStudents = filteredStudents.filter((student) => {
		let matchesSearchTerm = true;
		if (searchTerm) {
			const searchLowerNormalized = normalizeString(searchTerm);
			const isLockerSearch = searchLowerNormalized.startsWith('k:');

			if (isLockerSearch) {
				const lockerSearchTerm = searchLowerNormalized.slice(2).padStart(3, '0');
				const studentLocker = normalizeString(student.lockerCode?.padStart(3, '0') || '');
				matchesSearchTerm = studentLocker.includes(lockerSearchTerm);
			} else {
				// General text search
				const fullName = normalizeString(
					`${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}`,
				);
				const classes = normalizeString(student.klassen.join(' '));
				const locker = normalizeString(student.lockerCode || ''); // Include locker in general search too, if not specifically 'k:'

				// Check current lesson info
				let matchesLessonInfo = false;
				if (student.currentAgendaItem) {
					const currentItem = student.currentAgendaItem;
					const courses = normalizeString(currentItem.vakken.map((v) => v.code).join(' '));
					const locations = normalizeString(
						currentItem.locaties
							.map((l) => l.code ?? l.omschrijving)
							.filter(Boolean)
							.join(' '),
					);
					const teachers = normalizeString(
						currentItem.deelnames
							.filter((p) => p.type === 'medewerker')
							.map((p) => (p as AttendanceStaffMember).code)
							.join(' '),
					);

					matchesLessonInfo =
						courses.includes(searchLowerNormalized) ||
						locations.includes(searchLowerNormalized) ||
						teachers.includes(searchLowerNormalized);
				}

				matchesSearchTerm =
					fullName.includes(searchLowerNormalized) ||
					classes.includes(searchLowerNormalized) ||
					locker.includes(searchLowerNormalized) ||
					matchesLessonInfo;
			}
		}

		return matchesSearchTerm;
	});

	const sortedStudents = [...matchedStudents].sort((a, b) => {
		let valA: string | number = '';
		let valB: string | number = '';

		switch (sortColumn) {
			case 'naam':
				valA = normalizeString(`${a.achternaam} ${a.roepnaam}`);
				valB = normalizeString(`${b.achternaam} ${b.roepnaam}`);
				break;
			case 'klas':
				valA = normalizeString(a.klassen.join(', '));
				valB = normalizeString(b.klassen.join(', '));
				break;
			case 'lockerCode':
				valA = normalizeString(a.lockerCode || '');
				valB = normalizeString(b.lockerCode || '');
				break;
			case 'next':
			case 'now':
				// Sorting by agenda items is complex and not directly supported by simple string/number comparison.
				// For simplicity, these columns will not have a direct sorting effect.
				return 0;
		}

		if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
		if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
		return 0;
	});

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
										<AgendaItemDisplay type="next" studentId={student.id} />
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
