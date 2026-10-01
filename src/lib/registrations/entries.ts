import { getDateKey } from '@/lib/shared/dateUtils';
import type {
	AgendaRegistration,
	LessonAgendaEntry,
	RegistrationAgendaEntry,
	RegistrationTone,
} from '@/magister/response/agendaEntry.types';
import type { Justification, RegistrationsResponse } from '@/magister/response/registrations.types';

/** Absence is red, late is orange, everything else is yellow. */
export function registrationTone(reasonType: string): RegistrationTone {
	const key = reasonType.replace(/[^a-z0-9]+/gi, '').toLowerCase();
	if (key === 'absent') return 'absence';
	if (key === 'telaat') return 'late';
	return 'other';
}

/** Same calendar day; lesson hour span overlaps the registration hour, else times overlap. */
export function registrationMatchesLesson(registration: RegistrationAgendaEntry, lesson: LessonAgendaEntry): boolean {
	if (getDateKey(new Date(registration.start)) !== getDateKey(new Date(lesson.start))) return false;

	const lessonStartHour = lesson.item.lesuur?.begin;
	const lessonEndHour = lesson.item.lesuur?.einde || lessonStartHour;
	const startHour = registration.registration.lessonHourStart;
	const endHour = registration.registration.lessonHourEnd || startHour;
	if (lessonStartHour && lessonEndHour && startHour) {
		if (lessonStartHour <= endHour && lessonEndHour >= startHour) return true;
	}

	const start = new Date(registration.start).getTime();
	const end = new Date(registration.end).getTime();
	const lessonStart = new Date(lesson.start).getTime();
	const lessonEnd = new Date(lesson.end).getTime();
	return start < lessonEnd && end > lessonStart;
}

/** Id used by DELETE `/api/medewerkers/afspraken/verantwoordingen/{id}`. Prefer the self link. */
export function registrationDeleteId(justification: Justification): number {
	const href = justification.links?.self?.href ?? '';
	const match = /\/verantwoordingen\/(\d+)\/?$/.exec(href);
	if (match) return Number(match[1]);
	return justification.id;
}

/** Short label on the agenda block. The reason code is the abbreviation. */
export function registrationLabel(registration: AgendaRegistration): string {
	const code = registration.code.trim();
	return code || registration.description;
}

/** One or two letters for the registration mark. */
export function registrationAbbreviation(code: string, fallback = ''): string {
	const compact = code.replace(/\s+/g, '').toUpperCase();
	if (compact) return compact.slice(0, 2);
	return fallback.replace(/\s+/g, '').toUpperCase().slice(0, 2);
}

export function registrationLessonHourLabel(registration: AgendaRegistration): string | null {
	const { lessonHourStart, lessonHourEnd } = registration;
	if (!lessonHourStart) return null;
	if (!lessonHourEnd || lessonHourStart === lessonHourEnd) return String(lessonHourStart);
	return `${lessonHourStart}-${lessonHourEnd}`;
}

export function registrationEntriesForStudent(
	data: RegistrationsResponse,
	studentId: number,
): RegistrationAgendaEntry[] {
	const item = data.items?.find((entry) => entry.id === studentId);
	if (!item) return [];

	const entries: RegistrationAgendaEntry[] = [];
	for (const appointment of item.afspraken ?? []) {
		for (const justification of appointment.verantwoordingen ?? []) {
			const reason = justification.reden;
			entries.push({
				kind: 'registration',
				start: appointment.begin,
				end: appointment.einde,
				registration: {
					id: registrationDeleteId(justification),
					code: reason.code,
					description: reason.omschrijving.trim() || reason.type,
					tone: registrationTone(reason.type),
					isAuthorized: reason.isGeoorloofd,
					comment: justification.opmerking,
					appointmentDescription: appointment.omschrijving,
					lessonHourStart: appointment.lesuurBegin,
					lessonHourEnd: appointment.lesuurEinde,
				},
			});
		}
	}
	return entries;
}
