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

/** Lesson row on the student agenda that matches a registration mark. */
export function resolveRegistrationLesson(
	student: Student | undefined,
	entry: RegistrationLessonMatchInput,
): LessonAgendaEntry | null {
	if (!student) return null;

	const startDate = parseOptionalDate(entry.start);
	if (!startDate) return null;

	const dateKey = getDateKey(startDate);
	const agendaForDay = student.agenda?.[dateKey];
	if (!agendaForDay?.length) return null;

	const lessonEntries = agendaForDay.filter(isLessonEntry);
	const lessonHourStart = entry.lessonHourStart;
	const lessonHourEnd = entry.lessonHourEnd;

	if (lessonHourStart) {
		const endHour = lessonHourEnd || lessonHourStart;
		const byHour =
			lessonEntries.find((lesson) => lesson.item.lesuur?.begin === lessonHourStart) ??
			lessonEntries.find(
				(lesson) =>
					lesson.item.lesuur?.begin &&
					lesson.item.lesuur?.einde &&
					lesson.item.lesuur.begin <= lessonHourStart &&
					lesson.item.lesuur.einde >= endHour,
			);
		if (byHour) return byHour;
	}

	return findLessonEntry(startDate, lessonEntries);
}
