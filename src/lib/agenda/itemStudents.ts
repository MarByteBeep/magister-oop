import { isLessonEntry } from '@/lib/agenda/entryUtils';
import { agendaItemOverlapsLesson } from '@/lib/agenda/utils';
import { formatLocation } from '@/lib/shared/locationUtils';
import type { AgendaEntry, LessonAgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

function lessonLocations(entry: LessonAgendaEntry): string[] {
	return entry.item.locaties
		.map((loc) => formatLocation(loc))
		.filter((location): location is string => location !== undefined);
}

function lessonMatchesLocation(
	entry: AgendaEntry,
	firstLocation: string,
	lessonStart: string,
	lessonEnd: string,
): boolean {
	if (!isLessonEntry(entry)) return false;
	if (!agendaItemOverlapsLesson(entry.item, lessonStart, lessonEnd)) return false;
	return lessonLocations(entry).includes(firstLocation);
}

function studentHasLessonAtLocation(
	student: Student,
	dateKey: string,
	firstLocation: string,
	lessonStart: string,
	lessonEnd: string,
): boolean {
	const agenda = student.agenda;
	if (!agenda) return false;
	const dayEntries = agenda[dateKey];
	if (!dayEntries) return false;
	return dayEntries.some((entry) => lessonMatchesLocation(entry, firstLocation, lessonStart, lessonEnd));
}

export function findStudentsInAgendaLocation(
	students: Student[],
	dateKey: string,
	firstLocation: string,
	lessonStart: string,
	lessonEnd: string,
): Student[] {
	return students.filter((student) =>
		studentHasLessonAtLocation(student, dateKey, firstLocation, lessonStart, lessonEnd),
	);
}

function firstLessonLocation(entry: LessonAgendaEntry): string {
	const location = formatLocation(entry.item.locaties[0]);
	if (!location) return '';
	return location;
}

export function resolveAgendaItemLocation(entry: AgendaEntry): {
	firstLocation: string;
	hasLocation: boolean;
} {
	if (entry.kind !== 'lesson') return { firstLocation: '', hasLocation: false };
	const firstLocation = firstLessonLocation(entry);
	return { firstLocation, hasLocation: firstLocation !== '' };
}
