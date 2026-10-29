import { findLessonEntry, isLessonEntry } from '@/lib/agenda/entryUtils';
import { getDateKey, parseOptionalDate } from '@/lib/shared/dateUtils';
import type { LessonAgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

export type RegistrationLessonMatchInput = {
	start: string;
	end?: string;
	lessonHourStart?: number;
	lessonHourEnd?: number;
};

function lessonEntriesForDay(student: Student, dateKey: string): LessonAgendaEntry[] {
	const agenda = student.agenda;
	if (!agenda) return [];
	const agendaForDay = agenda[dateKey];
	if (!agendaForDay) return [];
	return agendaForDay.filter(isLessonEntry);
}

function definedHour(value: number | undefined): number | null {
	if (value === undefined) return null;
	return value;
}

function pairDefinedHours(begin: number | undefined, end: number | undefined): { begin: number; end: number } | null {
	const start = definedHour(begin);
	if (start === null) return null;
	const finish = definedHour(end);
	if (finish === null) return null;
	return { begin: start, end: finish };
}

function lessonHourBounds(lesson: LessonAgendaEntry): { begin: number; end: number } | null {
	const lesuur = lesson.item.lesuur;
	if (!lesuur) return null;
	return pairDefinedHours(lesuur.begin, lesuur.einde);
}

function lessonBeginsAtHour(lesson: LessonAgendaEntry, hour: number): boolean {
	const lesuur = lesson.item.lesuur;
	if (!lesuur) return false;
	return lesuur.begin === hour;
}

function lessonCoversHourRange(lesson: LessonAgendaEntry, startHour: number, endHour: number): boolean {
	const bounds = lessonHourBounds(lesson);
	if (!bounds) return false;
	if (bounds.begin > startHour) return false;
	return bounds.end >= endHour;
}

function findLessonByHourStart(lessons: LessonAgendaEntry[], hour: number): LessonAgendaEntry | null {
	const match = lessons.find((lesson) => lessonBeginsAtHour(lesson, hour));
	if (!match) return null;
	return match;
}

function findLessonCoveringHours(
	lessons: LessonAgendaEntry[],
	startHour: number,
	endHour: number,
): LessonAgendaEntry | null {
	const match = lessons.find((lesson) => lessonCoversHourRange(lesson, startHour, endHour));
	if (!match) return null;
	return match;
}

function resolveEndHour(lessonHourStart: number, lessonHourEnd: number | undefined): number {
	if (!lessonHourEnd) return lessonHourStart;
	return lessonHourEnd;
}

function findLessonMatchingHours(
	lessons: LessonAgendaEntry[],
	lessonHourStart: number,
	lessonHourEnd: number | undefined,
): LessonAgendaEntry | null {
	const exact = findLessonByHourStart(lessons, lessonHourStart);
	if (exact) return exact;
	return findLessonCoveringHours(lessons, lessonHourStart, resolveEndHour(lessonHourStart, lessonHourEnd));
}

function resolveLessonFromEntries(
	startDate: Date,
	lessons: LessonAgendaEntry[],
	entry: RegistrationLessonMatchInput,
): LessonAgendaEntry | null {
	if (!entry.lessonHourStart) return findLessonEntry(startDate, lessons);
	const byHour = findLessonMatchingHours(lessons, entry.lessonHourStart, entry.lessonHourEnd);
	if (byHour) return byHour;
	return findLessonEntry(startDate, lessons);
}

/** Lesson row on the student agenda that matches a registration mark. */
export function resolveRegistrationLesson(
	student: Student | undefined,
	entry: RegistrationLessonMatchInput,
): LessonAgendaEntry | null {
	if (!student) return null;
	const startDate = parseOptionalDate(entry.start);
	if (!startDate) return null;
	const lessons = lessonEntriesForDay(student, getDateKey(startDate));
	return resolveLessonFromEntries(startDate, lessons, entry);
}
