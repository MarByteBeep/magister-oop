import { useMemo } from 'react';
import { normalizeString } from '@/lib/stringUtils';
import type { AttendanceStaffMember } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';

export type SortColumn = 'naam' | 'klas' | 'lockerCode' | 'now' | 'next';
export type SortDirection = 'asc' | 'desc';

function studentMatchesSearch(student: Student, searchTerm: string): boolean {
	const searchLowerNormalized = normalizeString(searchTerm);
	const isLockerSearch = searchLowerNormalized.startsWith('k:');

	if (isLockerSearch) {
		const lockerSearchTerm = searchLowerNormalized.slice(2).padStart(3, '0');
		const studentLocker = normalizeString(student.lockerCode?.padStart(3, '0') || '');
		return studentLocker.includes(lockerSearchTerm);
	}

	const fullName = normalizeString(`${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}`);
	const classes = normalizeString(student.klassen.join(' '));
	const locker = normalizeString(student.lockerCode || '');

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

	return (
		fullName.includes(searchLowerNormalized) ||
		classes.includes(searchLowerNormalized) ||
		locker.includes(searchLowerNormalized) ||
		matchesLessonInfo
	);
}

const sortValueGetters: Record<Exclude<SortColumn, 'now' | 'next'>, (student: Student) => string> = {
	naam: (student) => normalizeString(`${student.achternaam} ${student.roepnaam}`),
	klas: (student) => normalizeString(student.klassen.join(', ')),
	lockerCode: (student) => normalizeString(student.lockerCode || ''),
};

function compareStudents(a: Student, b: Student, sortColumn: SortColumn, sortDirection: SortDirection): number {
	if (sortColumn === 'now' || sortColumn === 'next') return 0;

	const getValue = sortValueGetters[sortColumn];
	const valA = getValue(a);
	const valB = getValue(b);

	if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
	if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
	return 0;
}

export function useStudentListFilters(
	students: Student[],
	selectedStudies: Set<string>,
	searchTerm: string,
	sortColumn: SortColumn,
	sortDirection: SortDirection,
) {
	const uniqueStudies = useMemo(() => {
		const studies = new Set(students.flatMap((s) => s.studies));
		return Array.from(studies).sort();
	}, [students]);

	const filteredStudents = useMemo(
		() =>
			students.filter((student) =>
				selectedStudies.size ? student.studies.some((s) => selectedStudies.has(s)) : true,
			),
		[students, selectedStudies],
	);

	const sortedStudents = useMemo(() => {
		const matched = searchTerm
			? filteredStudents.filter((student) => studentMatchesSearch(student, searchTerm))
			: filteredStudents;

		return [...matched].sort((a, b) => compareStudents(a, b, sortColumn, sortDirection));
	}, [filteredStudents, searchTerm, sortColumn, sortDirection]);

	return { uniqueStudies, filteredStudents, sortedStudents };
}
