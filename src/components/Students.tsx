'use client';

import { useEffect, useMemo, useState } from 'react';
import { LuFilter, LuX } from 'react-icons/lu';
import ClickAvatarPreview from '@/components/ClickAvatarPreview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStudentsContext } from '@/context/StudentsContext';
import { useAutoFocus } from '@/hooks/useAutofocus';
import { storage } from '@/lib/storage';
import { normalizeString } from '@/lib/stringUtils';
import { cn } from '@/lib/utils';
import type { AttendanceStaffMember } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';
import LessonHourBadge from './LessonHourBadge';
import LoadingSpinner from './LoadingSpinner';
import StudentModal from './StudentModal';
import AgendaItemDisplay from './student/AgendaItemDisplay';
import { Checkbox } from './ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

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
	const [showPermanentFilters, setShowPermanentFilters] = useState(false);
	const [initializedSearchTerm, setInitializedSearchTerm] = useState(false);
	const searchInput = useAutoFocus<HTMLInputElement>();

	// Load search term from session storage on mount
	useEffect(() => {
		(async () => {
			const stored = await storage.session.get<string>(STUDENTS_SEARCH_TERM_STORAGE_KEY);
			if (stored) {
				setSearchTerm(stored);
			}
			setInitializedSearchTerm(true);
		})();
	}, []);

	// Save search term to session storage when it changes
	useEffect(() => {
		if (!initializedSearchTerm) return;
		void storage.session.set(STUDENTS_SEARCH_TERM_STORAGE_KEY, searchTerm);
	}, [searchTerm, initializedSearchTerm]);

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

	return (
		<div className="w-full">
			<div className="flex items-center mb-4 gap-2">
				<div className="relative grow">
					<input
						ref={searchInput}
						type="text"
						placeholder="Zoek op naam, klas, kluisje of huidige les..."
						className="w-full p-2 border rounded-md bg-input text-foreground text-md pr-10" // Added pr-10 for button space
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<Button
							variant="ghost"
							size="icon"
							className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
							onClick={() => setSearchTerm('')}
							title="Wis filter"
						>
							<LuX className="h-4 w-4" />
						</Button>
					)}
				</div>
				{loading && (
					<Tooltip>
						<TooltipTrigger asChild>
							<div>
								<LoadingSpinner />
							</div>
						</TooltipTrigger>
						<TooltipContent>
							{studentsNeedingAgendaCount > 0
								? `${studentsNeedingAgendaCount} leerlingen nog te laden`
								: 'Laden...'}
						</TooltipContent>
					</Tooltip>
				)}
				<Button
					variant={showPermanentFilters ? 'default' : 'outline'}
					size="icon"
					className={selectedStudies.size > 0 ? 'relative mr-3' : 'relative'}
					onClick={() => setShowPermanentFilters(!showPermanentFilters)}
					title="Permanente filters"
				>
					{selectedStudies.size > 0 && (
						<Badge variant="default" className="absolute -top-2.5 -right-2.5 h-5 min-w-5 px-1 tabular-nums">
							{selectedStudies.size}
						</Badge>
					)}
					<LuFilter className="h-4 w-4" />
				</Button>
			</div>

			<div
				className={cn(
					'overflow-hidden transition-all duration-300 ease-in-out',
					showPermanentFilters ? 'max-h-screen opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0',
				)}
			>
				<div className="p-4 border rounded-md bg-card shadow-sm">
					<h3 className="text-sm font-medium text-foreground mb-2">Permanente filters</h3>
					<div className="grid grid-cols-4 gap-2">
						{uniqueStudies.map((study) => (
							<div key={study} className="flex items-center space-x-2">
								<Checkbox
									id={`study-${study}`}
									checked={selectedStudies.has(study)}
									onCheckedChange={(checked) => handleStudyFilterChange(study, checked as boolean)}
								/>
								<label htmlFor={`study-${study}`} className="text-sm font-medium leading-none">
									{study}
								</label>
							</div>
						))}
					</div>
				</div>
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
