import { isAbsenceNoticeEntry, isLessonEntry, isReturnMeasureEntry } from '@/lib/agenda/entryUtils';
import { isFullDayReturnMeasureEntry } from '@/lib/agenda/fullDayScheduleUtils';
import { formatCompactTeacherLabel, getAgendaItemInfo } from '@/lib/agenda/utils';
import { getReturnMeasureDisplay, type ReturnMeasureDisplay } from '@/lib/return-measure/utils';
import { formatLocation } from '@/lib/shared/locationUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { AgendaEntry, ReturnMeasureAgendaEntry } from '@/magister/response/agendaEntry.types';

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

function resolveReturnMeasureKind(entry: ReturnMeasureAgendaEntry): AgendaEventKind {
	if (isFullDayReturnMeasureEntry(entry)) return 'returnMeasureFullDay';
	return 'returnMeasureGutter';
}

function resolveAgendaEventKind(entry: AgendaEntry): AgendaEventKind {
	if (isReturnMeasureEntry(entry)) return resolveReturnMeasureKind(entry);
	if (isAbsenceNoticeEntry(entry)) return 'absenceNotice';
	return 'lesson';
}

function isGutterOverlayKind(kind: AgendaEventKind): boolean {
	if (kind === 'absenceNotice') return true;
	return kind === 'returnMeasureGutter';
}

function primaryLabelOf(display: ReturnMeasureDisplay | null): string | undefined {
	if (!display) return undefined;
	return display.primaryLabel;
}

function lessonCourseOrSubject(item: AgendaItem): string | undefined {
	const { courseCodes, subject } = getAgendaItemInfo(item);
	if (courseCodes !== undefined) return courseCodes;
	return subject;
}

function resolveLessonEventTitle(entry: AgendaEntry): string | undefined {
	if (!isLessonEntry(entry)) return undefined;
	return lessonCourseOrSubject(entry.item);
}

function resolveAgendaEventTitle(
	entry: AgendaEntry,
	returnMeasureDisplay: ReturnMeasureDisplay | null,
): string | undefined {
	if (isReturnMeasureEntry(entry)) return primaryLabelOf(returnMeasureDisplay);
	if (isAbsenceNoticeEntry(entry)) return entry.notice.attendanceTypeDescription;
	return resolveLessonEventTitle(entry);
}

function resolveReturnMeasureDisplayForEntry(entry: AgendaEntry): ReturnMeasureDisplay | null {
	if (!isReturnMeasureEntry(entry)) return null;
	return getReturnMeasureDisplay(entry.measure);
}

function lessonBeginOf(item: AgendaItem): number | undefined {
	const lessonHour = item.lesuur;
	if (!lessonHour) return undefined;
	return lessonHour.begin;
}

type LessonDisplayFields = {
	isLesson: boolean;
	firstLocation: string | undefined;
	teacherLabel: string | undefined;
	lessonBegin: number | undefined;
};

function emptyLessonFields(): LessonDisplayFields {
	return {
		isLesson: false,
		firstLocation: undefined,
		teacherLabel: undefined,
		lessonBegin: undefined,
	};
}

function lessonFieldsFromItem(item: AgendaItem): LessonDisplayFields {
	return {
		isLesson: true,
		firstLocation: formatLocation(item.locaties[0]),
		teacherLabel: formatCompactTeacherLabel(item),
		lessonBegin: lessonBeginOf(item),
	};
}

function resolveLessonFields(entry: AgendaEntry): LessonDisplayFields {
	if (!isLessonEntry(entry)) return emptyLessonFields();
	return lessonFieldsFromItem(entry.item);
}

function resolveActiveStyle(isGutterOverlay: boolean, isFullDayReturnMeasure: boolean, isActive: boolean): boolean {
	if (isGutterOverlay) return false;
	if (isFullDayReturnMeasure) return false;
	return isActive;
}

function resolveCompactFlag(isCompact: boolean, isGutterOverlay: boolean): boolean {
	if (isCompact) return true;
	return isGutterOverlay;
}

export function resolveAgendaEventDisplay(
	entry: AgendaEntry,
	isCompact: boolean,
	isActive: boolean,
): AgendaEventDisplay {
	const kind = resolveAgendaEventKind(entry);
	const isFullDayReturnMeasure = kind === 'returnMeasureFullDay';
	const isGutterOverlay = isGutterOverlayKind(kind);
	const returnMeasureDisplay = resolveReturnMeasureDisplayForEntry(entry);
	const lesson = resolveLessonFields(entry);
	const durationMinutes = getEntryDurationMinutes(entry);

	return {
		kind,
		isActiveStyle: resolveActiveStyle(isGutterOverlay, isFullDayReturnMeasure, isActive),
		isCompact: resolveCompactFlag(isCompact, isGutterOverlay),
		isGutterOverlay,
		isFullDayReturnMeasure,
		isLesson: lesson.isLesson,
		title: resolveAgendaEventTitle(entry, returnMeasureDisplay),
		teacherLabel: lesson.teacherLabel,
		firstLocation: lesson.firstLocation,
		returnMeasureDisplay,
		beginTime: new Date(entry.start),
		endTime: new Date(entry.end),
		canWrapTitle: durationMinutes > 60,
		lessonBegin: lesson.lessonBegin,
	};
}
