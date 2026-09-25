import { useMemo } from 'react';
import { findLessonEntryPreferringLessons } from '@/lib/agendaEntryUtils';
import { getAgendaItemInfo } from '@/lib/agendaUtils';
import { getDateKey } from '@/lib/dateUtils';
import { normalizeString } from '@/lib/stringUtils';
import type { Student } from '@/types/student.types';

export type SortColumn = 'name' | 'class' | 'lockerCode' | 'now' | 'next';
export type SortDirection = 'asc' | 'desc';

function lessonSearchableText(student: Student, currentTime: Date): string {
	const agendaForToday = student.agenda?.[getDateKey(currentTime)];
	if (!agendaForToday) return '';

	const entry = findLessonEntryPreferringLessons(currentTime, agendaForToday);
	if (!entry) return '';

	const { courseCodes, locations, teachersCodes } = getAgendaItemInfo(entry.item);
	return normalizeString([courseCodes, locations, teachersCodes].filter(Boolean).join(' '));
}

export function studentMatchesSearch(student: Student, searchTerm: string, currentTime: Date): boolean {
	const searchLowerNormalized = normalizeString(searchTerm);
	const isLockerSearch = searchLowerNormalized.startsWith('k:');

	if (isLockerSearch) {
		const lockerSearchTerm = searchLowerNormalized.slice(2).padStart(3, '0');
		const studentLocker = normalizeString(student.lockerCode?.padStart(3, '0') || '');
		return studentLocker.includes(lockerSearchTerm);
	}

	const searchWords = searchLowerNormalized.split(/\s+/).filter(Boolean);
	if (searchWords.length === 0) return true;

	const fullName = normalizeString(`${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}`);
	const classes = normalizeString(student.klassen.join(' '));
	const locker = normalizeString(student.lockerCode || '');
	const lessonText = lessonSearchableText(student, currentTime);

	return searchWords.every(
		(word) =>
			fullName.includes(word) || classes.includes(word) || locker.includes(word) || lessonText.includes(word),
	);
}

const sortValueGetters: Record<Exclude<SortColumn, 'now' | 'next'>, (student: Student) => string> = {
	name: (student) => normalizeString(`${student.achternaam} ${student.roepnaam}`),
	class: (student) => normalizeString(student.klassen.join(', ')),
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
	currentTime: Date,
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
			? filteredStudents.filter((student) => studentMatchesSearch(student, searchTerm, currentTime))
			: filteredStudents;

		return [...matched].sort((a, b) => compareStudents(a, b, sortColumn, sortDirection));
	}, [filteredStudents, searchTerm, sortColumn, sortDirection, currentTime]);

	return { uniqueStudies, filteredStudents, sortedStudents };
}
