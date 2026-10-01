import type { AbsenceNotice } from '@/magister/response/absenceNotice.types';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { ScheduledReturnMeasure } from '@/magister/response/returnMeasure.types';

export type LessonAgendaEntry = {
	kind: 'lesson';
	start: string;
	end: string;
	item: AgendaItem;
};

export type ReturnMeasureAgendaEntry = {
	kind: 'return-measure';
	start: string;
	end: string;
	measure: ScheduledReturnMeasure;
};

export type AbsenceNoticeAgendaEntry = {
	kind: 'absence-notice';
	start: string;
	end: string;
	notice: AbsenceNotice;
};

/** Visual group for a registration mark. */
export type RegistrationTone = 'absence' | 'late' | 'other';

/** Registration shown on a student agenda. English fields; mapped from the Magister justification. */
export type AgendaRegistration = {
	id: number;
	code: string;
	description: string;
	tone: RegistrationTone;
	isAuthorized: boolean;
	comment: string | null;
	appointmentDescription: string;
	lessonHourStart: number;
	lessonHourEnd: number;
};

export type RegistrationAgendaEntry = {
	kind: 'registration';
	start: string;
	end: string;
	registration: AgendaRegistration;
};

/** Calendar row: Magister lesson or an overlay from return measures, absence notices, or registrations. */
export type AgendaEntry =
	| LessonAgendaEntry
	| ReturnMeasureAgendaEntry
	| AbsenceNoticeAgendaEntry
	| RegistrationAgendaEntry;
