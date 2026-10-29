import { getAgendaItemInfo } from '@/lib/agenda/utils';
import { registrationLessonHourLabel } from '@/lib/registrations/entries';
import { resolveRegistrationLesson } from '@/lib/registrations/lessonMatch';
import { formatTime } from '@/lib/shared/dateUtils';
import { trimmedOrUndefined } from '@/lib/shared/stringUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { RegistrationAgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

export type RegistrationModalDisplay = {
	comment: string | undefined;
	hour: string | null;
	subjectName: string;
	teachers: string | undefined;
	locations: string | undefined;
	lessonBegin: string;
	lessonEnd: string;
};

function subjectFromLessonInfo(
	courseDescriptions: string | undefined,
	subject: string | undefined,
	fallback: string,
): string {
	if (courseDescriptions !== undefined) return courseDescriptions;
	if (subject !== undefined) return subject;
	return fallback;
}

function resolveSubjectName(lessonItem: AgendaItem | null, appointmentDescription: string): string {
	if (!lessonItem) return appointmentDescription.trim();
	const lessonInfo = getAgendaItemInfo(lessonItem);
	return subjectFromLessonInfo(lessonInfo.courseDescriptions, lessonInfo.subject, appointmentDescription.trim());
}

function teachersOf(lessonItem: AgendaItem | null): string | undefined {
	if (!lessonItem) return undefined;
	return getAgendaItemInfo(lessonItem).teachers;
}

function locationsOf(lessonItem: AgendaItem | null): string | undefined {
	if (!lessonItem) return undefined;
	return getAgendaItemInfo(lessonItem).locations;
}

function resolveLessonBounds(
	lessonEntry: { start: string; end: string } | null,
	entry: RegistrationAgendaEntry,
): { begin: string; end: string } {
	if (!lessonEntry) {
		return {
			begin: formatTime(new Date(entry.start)),
			end: formatTime(new Date(entry.end)),
		};
	}
	return {
		begin: formatTime(new Date(lessonEntry.start)),
		end: formatTime(new Date(lessonEntry.end)),
	};
}

export function resolveRegistrationModalDisplay(
	entry: RegistrationAgendaEntry,
	student: Student | undefined,
): RegistrationModalDisplay {
	const { registration } = entry;
	const lessonEntry = resolveRegistrationLesson(student, {
		start: entry.start,
		end: entry.end,
		lessonHourStart: registration.lessonHourStart,
		lessonHourEnd: registration.lessonHourEnd,
	});
	const lessonItem = lessonEntry ? lessonEntry.item : null;
	const bounds = resolveLessonBounds(lessonEntry, entry);

	return {
		comment: trimmedOrUndefined(registration.comment),
		hour: registrationLessonHourLabel(registration),
		subjectName: resolveSubjectName(lessonItem, registration.appointmentDescription),
		teachers: teachersOf(lessonItem),
		locations: locationsOf(lessonItem),
		lessonBegin: bounds.begin,
		lessonEnd: bounds.end,
	};
}
