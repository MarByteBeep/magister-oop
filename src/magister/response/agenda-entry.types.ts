import type { AbsenceNotice } from '@/magister/response/absence-notice.types';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { ReturnMeasure } from '@/magister/response/return-measure.types';

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
	measure: ReturnMeasure;
};

export type AbsenceNoticeAgendaEntry = {
	kind: 'absence-notice';
	start: string;
	end: string;
	notice: AbsenceNotice;
};

/** Calendar row: Magister lesson or an overlay from return measures / absence notices. */
export type AgendaEntry = LessonAgendaEntry | ReturnMeasureAgendaEntry | AbsenceNoticeAgendaEntry;
