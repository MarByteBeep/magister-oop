import { getAgendaItemInfo } from '@/lib/agenda/utils';
import { registrationLessonHourLabel } from '@/lib/registrations/entries';
import { resolveRegistrationLesson } from '@/lib/registrations/lessonMatch';
import { formatTime } from '@/lib/shared/dateUtils';
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

export function resolveRegistrationModalDisplay(
	entry: RegistrationAgendaEntry,
	student: Student | undefined,
): RegistrationModalDisplay {
	const { registration } = entry;
	const comment = registration.comment?.trim() || undefined;
	const hour = registrationLessonHourLabel(registration);
	const lessonEntry = resolveRegistrationLesson(student, {
		start: entry.start,
		end: entry.end,
		lessonHourStart: registration.lessonHourStart,
		lessonHourEnd: registration.lessonHourEnd,
	});
	const lessonInfo = lessonEntry ? getAgendaItemInfo(lessonEntry.item) : null;
	const subjectName =
		lessonInfo?.courseDescriptions ?? lessonInfo?.subject ?? registration.appointmentDescription.trim();

	return {
		comment,
		hour,
		subjectName,
		teachers: lessonInfo?.teachers,
		locations: lessonInfo?.locations,
		lessonBegin: formatTime(new Date(lessonEntry?.start ?? entry.start)),
		lessonEnd: formatTime(new Date(lessonEntry?.end ?? entry.end)),
	};
}
