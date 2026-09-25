import { isAbsenceNoticeEntry, isLessonEntry, isReturnMeasureEntry } from '@/lib/agendaEntryUtils';
import { formatCompactTeacherLabel, getAgendaItemInfo } from '@/lib/agendaUtils';
import { isFullDayReturnMeasureEntry } from '@/lib/fullDayScheduleUtils';
import { formatLocation } from '@/lib/locationUtils';
import { getReturnMeasureDisplay, type ReturnMeasureDisplay } from '@/lib/returnMeasureUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';

export type AgendaEventKind = 'lesson' | 'returnMeasureFullDay' | 'returnMeasureGutter' | 'absenceNotice';

export interface AgendaEventDisplay {
	kind: AgendaEventKind;
	isActiveStyle: boolean;
	isCompact: boolean;
	isGutterOverlay: boolean;
	isFullDayReturnMeasure: boolean;
	isLesson: boolean;
	title: string | undefined;
	teacherLabel: string | undefined;
	firstLocation: string | undefined;
	returnMeasureDisplay: ReturnMeasureDisplay | null;
	beginTime: Date;
	endTime: Date;
	canWrapTitle: boolean;
	lessonBegin: number | undefined;
}

function getEntryDurationMinutes(entry: AgendaEntry): number {
	return (new Date(entry.end).getTime() - new Date(entry.start).getTime()) / 60_000;
}

function resolveAgendaEventKind(entry: AgendaEntry): AgendaEventKind {
	if (isReturnMeasureEntry(entry)) {
		return isFullDayReturnMeasureEntry(entry) ? 'returnMeasureFullDay' : 'returnMeasureGutter';
	}
	if (isAbsenceNoticeEntry(entry)) return 'absenceNotice';
	return 'lesson';
}

function resolveAgendaEventTitle(
	entry: AgendaEntry,
	returnMeasureDisplay: ReturnMeasureDisplay | null,
): string | undefined {
	if (isReturnMeasureEntry(entry)) return returnMeasureDisplay?.primaryLabel;
	if (isAbsenceNoticeEntry(entry)) return entry.notice.attendanceTypeDescription;
	if (isLessonEntry(entry)) {
		const { courseCodes, subject } = getAgendaItemInfo(entry.item);
		return courseCodes ?? subject;
	}
	return undefined;
}

export function resolveAgendaEventDisplay(
	entry: AgendaEntry,
	isCompact: boolean,
	isActive: boolean,
): AgendaEventDisplay {
	const isReturnMeasure = isReturnMeasureEntry(entry);
	const isAbsenceNotice = isAbsenceNoticeEntry(entry);
	const isLesson = isLessonEntry(entry);
	const isFullDayReturnMeasure = isReturnMeasure && isFullDayReturnMeasureEntry(entry);
	const isGutterOverlay = isAbsenceNotice || (isReturnMeasure && !isFullDayReturnMeasure);
	const returnMeasureDisplay = isReturnMeasure ? getReturnMeasureDisplay(entry.measure) : null;
	const lessonItem = isLesson ? entry.item : null;
	const firstLocation = lessonItem ? formatLocation(lessonItem.locaties[0]) : undefined;
	const teacherLabel = lessonItem ? formatCompactTeacherLabel(lessonItem) : undefined;
	const durationMinutes = getEntryDurationMinutes(entry);

	return {
		kind: resolveAgendaEventKind(entry),
		isActiveStyle: isGutterOverlay || isFullDayReturnMeasure ? false : isActive,
		isCompact: isCompact || isGutterOverlay,
		isGutterOverlay,
		isFullDayReturnMeasure,
		isLesson,
		title: resolveAgendaEventTitle(entry, returnMeasureDisplay),
		teacherLabel,
		firstLocation,
		returnMeasureDisplay,
		beginTime: new Date(entry.start),
		endTime: new Date(entry.end),
		canWrapTitle: durationMinutes > 60,
		lessonBegin: lessonItem?.lesuur?.begin,
	};
}
