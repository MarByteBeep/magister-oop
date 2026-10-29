import { isAbsenceNoticeEntry, isLessonEntry } from '@/lib/agenda/entryUtils';
import { getAgendaItemInfo } from '@/lib/agenda/utils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { AgendaEntry, LessonAgendaEntry } from '@/magister/response/agendaEntry.types';

function lessonTitleFromItem(item: AgendaItem): string {
	const { courseDescriptions, subject } = getAgendaItemInfo(item);
	if (courseDescriptions !== undefined) return courseDescriptions;
	if (subject !== undefined) return subject;
	return 'Agenda item';
}

function resolveLessonModalTitle(entry: AgendaEntry): string {
	if (!isLessonEntry(entry)) return 'Agenda item';
	return lessonTitleFromItem(entry.item);
}

export function resolveStandardModalTitle(entry: AgendaEntry): string {
	if (isAbsenceNoticeEntry(entry)) return entry.notice.attendanceTypeDescription;
	return resolveLessonModalTitle(entry);
}

export type LessonAgendaInfo = {
	courseDescriptions: string | undefined;
	courseCodes: string | undefined;
	teachers: string | undefined;
	locations: string | undefined;
};

const emptyLessonAgendaInfo: LessonAgendaInfo = {
	courseDescriptions: undefined,
	courseCodes: undefined,
	teachers: undefined,
	locations: undefined,
};

export function resolveLessonAgendaInfo(entry: LessonAgendaEntry | null): LessonAgendaInfo {
	if (!entry) return emptyLessonAgendaInfo;
	return getAgendaItemInfo(entry.item);
}
