import { isLessonEntry, isReturnMeasureEntry } from '@/lib/agenda/entryUtils';
import { getFullDayScheduleSelection, isFullDayScheduleSelection } from '@/lib/agenda/fullDayScheduleUtils';
import { isAgendaDayLoaded } from '@/lib/agenda/loadUtils';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { buildAgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { getAgendaItemInfo, getPreSchoolTimeTable, type TimeSlot, timeTable } from '@/lib/agenda/utils';
import { clampReturnMeasureDay, isReturnMeasureDateInPast } from '@/lib/return-measure/scheduleBounds';
import { formatDateNumeric } from '@/lib/shared/dateLabels';
import { addDays, addSchoolDays, formatTime, getDateKey, getNow, getStartOfWeek } from '@/lib/shared/dateUtils';
import type { AgendaEntry, LessonAgendaEntry } from '@/magister/response/agendaEntry.types';

export type ReturnMeasureScheduleKind = 'full-day' | 'pre-school' | 'hour';

const MAX_SCHOOL_DAYS_TO_SEARCH = 20;

/** Next weekday after `date` (Mon–Fri). */
export function nextSchoolDay(date: Date): Date {
	return addSchoolDays(date, 2);
}

export function returnMeasureScheduleKind(start: Date, end: Date): ReturnMeasureScheduleKind {
	if (isFullDayScheduleSelection({ start, end })) return 'full-day';

	const startTime = formatTime(start);
	const endTime = formatTime(end);
	const preSchool = getPreSchoolTimeTable()[0];
	if (preSchool && startTime === preSchool.start && endTime === preSchool.end) return 'pre-school';

	return 'hour';
}

export function rescheduleReturnMeasureDescription(originalStart: Date): string {
	return `Niet gemeld op ${formatDateNumeric(originalStart)}`;
}

function entryOverlapsSlot(entry: AgendaEntry, slot: TimeSlot): boolean {
	const entryStart = formatTime(new Date(entry.start));
	const entryEnd = formatTime(new Date(entry.end));
	return entryStart < slot.end && entryEnd > slot.start;
}

/** Lessons and return measures that overlap `slot` (used for hour / 08:00 report). */
function entriesOccupySlot(entries: readonly AgendaEntry[], slot: TimeSlot): boolean {
	return entries.some((entry) => {
		if (!isLessonEntry(entry) && !isReturnMeasureEntry(entry)) return false;
		return entryOverlapsSlot(entry, slot);
	});
}

/** Return measures only — full-day suggestions must not land on top of another measure. */
function returnMeasuresOccupySlot(entries: readonly AgendaEntry[], slot: TimeSlot): boolean {
	return entries.some((entry) => isReturnMeasureEntry(entry) && entryOverlapsSlot(entry, slot));
}

function selectionSlot(selection: AgendaSlotSelection): TimeSlot {
	const rangeStart = selection.start <= selection.end ? selection.start : selection.end;
	const rangeEnd = selection.start <= selection.end ? selection.end : selection.start;
	return { start: formatTime(rangeStart), end: formatTime(rangeEnd) };
}

function lessonSubjectLabel(entry: LessonAgendaEntry): string {
	const { courseDescriptions, courseCodes, subject } = getAgendaItemInfo(entry.item);
	return courseDescriptions ?? courseCodes ?? (subject?.trim() || 'Les');
}

/** Subjects of lessons that overlap the pick (empty when none / full-day). */
export function overlappingLessonSubjects(
	selection: AgendaSlotSelection,
	dayEntries: readonly AgendaEntry[],
): string[] {
	if (isFullDayScheduleSelection(selection)) return [];
	const slot = selectionSlot(selection);
	const subjects: string[] = [];
	for (const entry of dayEntries) {
		if (!isLessonEntry(entry) || !entryOverlapsSlot(entry, slot)) continue;
		const label = lessonSubjectLabel(entry);
		if (!subjects.includes(label)) subjects.push(label);
	}
	return subjects;
}

/** True when the pick overlaps a lesson (allowed, but the UI should warn). */
export function selectionOverlapsLesson(selection: AgendaSlotSelection, dayEntries: readonly AgendaEntry[]): boolean {
	return overlappingLessonSubjects(selection, dayEntries).length > 0;
}

function isBlockedByReturnMeasure(selection: AgendaSlotSelection, dayEntries: readonly AgendaEntry[]): boolean {
	return returnMeasuresOccupySlot(dayEntries, selectionSlot(selection));
}

/** Free consecutive regular lesson hours (not the 08:00 pre-school report slot). */
function findFreeLessonHourRange(
	dateKey: string,
	slotCount: number,
	entries: readonly AgendaEntry[],
): AgendaSlotSelection | null {
	const slots = timeTable;
	if (slotCount < 1 || slotCount > slots.length) return null;

	for (let from = 0; from <= slots.length - slotCount; from++) {
		const range = slots.slice(from, from + slotCount);
		if (range.some((slot) => entriesOccupySlot(entries, slot))) continue;
		return buildAgendaSlotSelection(dateKey, range[0].start, range[range.length - 1].end);
	}

	return null;
}

function lessonHourCountForRange(start: Date, end: Date): number {
	const startTime = formatTime(start);
	const endTime = formatTime(end);
	let from = -1;
	let to = -1;
	for (let index = 0; index < timeTable.length; index++) {
		const slot = timeTable[index];
		if (slot.start < endTime && slot.end > startTime) {
			if (from < 0) from = index;
			to = index;
		}
	}
	if (from < 0) return 1;
	return to - from + 1;
}

function eachSchoolDayFrom(start: Date, count: number): Date[] {
	const days: Date[] = [];
	let current = start;
	for (let index = 0; index < count; index++) {
		days.push(current);
		current = nextSchoolDay(current);
	}
	return days;
}

function findFirstSchoolDaySuggestion(
	fromDay: Date,
	agendaByDateKey: ReadonlyMap<string, readonly AgendaEntry[]>,
	tryDay: (day: Date, dateKey: string, entries: readonly AgendaEntry[] | undefined) => AgendaSlotSelection | null,
): AgendaSlotSelection | null {
	for (const day of eachSchoolDayFrom(fromDay, MAX_SCHOOL_DAYS_TO_SEARCH)) {
		const dateKey = getDateKey(day);
		const suggestion = tryDay(day, dateKey, agendaByDateKey.get(dateKey));
		if (suggestion) return suggestion;
	}
	return null;
}

function suggestFullDayReschedule(
	fromDay: Date,
	agendaByDateKey: ReadonlyMap<string, readonly AgendaEntry[]>,
): AgendaSlotSelection | null {
	const fullDaySlot = selectionSlot(getFullDayScheduleSelection(fromDay));
	return findFirstSchoolDaySuggestion(fromDay, agendaByDateKey, (day, _dateKey, entries) => {
		if (entries != null && returnMeasuresOccupySlot(entries, fullDaySlot)) return null;
		return getFullDayScheduleSelection(day);
	});
}

function suggestPreSchoolReschedule(
	fromDay: Date,
	startTime: string,
	endTime: string,
	agendaByDateKey: ReadonlyMap<string, readonly AgendaEntry[]>,
): AgendaSlotSelection | null {
	const slot: TimeSlot = { start: startTime, end: endTime };
	return findFirstSchoolDaySuggestion(fromDay, agendaByDateKey, (_day, dateKey, entries) => {
		if (entries != null && entriesOccupySlot(entries, slot)) return null;
		return buildAgendaSlotSelection(dateKey, startTime, endTime);
	});
}

function suggestHourReschedule(
	fromDay: Date,
	slotCount: number,
	agendaByDateKey: ReadonlyMap<string, readonly AgendaEntry[]>,
): AgendaSlotSelection | null {
	return findFirstSchoolDaySuggestion(fromDay, agendaByDateKey, (_day, dateKey, entries) => {
		if (entries == null) return null;
		return findFreeLessonHourRange(dateKey, slotCount, entries);
	});
}

/**
 * Suggest a new slot after a missed measure.
 * Full-day / 08:00 report keep the same times on the next free school day
 * (skips days that already have an overlapping return measure / occupation).
 * Hour returns need a free lesson slot on a later school day (uses loaded agenda).
 */
export function suggestReturnMeasureReschedule(
	originalStart: Date,
	originalEnd: Date,
	agendaByDateKey: ReadonlyMap<string, readonly AgendaEntry[]>,
	now: Date = getNow(),
): AgendaSlotSelection | null {
	const kind = returnMeasureScheduleKind(originalStart, originalEnd);
	const targetDay = clampReturnMeasureDay(nextSchoolDay(originalStart), now);

	if (kind === 'full-day') return suggestFullDayReschedule(targetDay, agendaByDateKey);
	if (kind === 'pre-school') {
		return suggestPreSchoolReschedule(
			targetDay,
			formatTime(originalStart),
			formatTime(originalEnd),
			agendaByDateKey,
		);
	}
	return suggestHourReschedule(targetDay, lessonHourCountForRange(originalStart, originalEnd), agendaByDateKey);
}

/** Build agenda lookup from a student agenda map (missing days stay absent). */
export function agendaMapFromStudentAgenda(
	agenda: Record<string, AgendaEntry[]> | undefined,
	fromDate: Date,
	schoolDayCount = MAX_SCHOOL_DAYS_TO_SEARCH,
): Map<string, readonly AgendaEntry[]> {
	const map = new Map<string, readonly AgendaEntry[]>();
	if (!agenda) return map;

	for (const day of eachSchoolDayFrom(fromDate, schoolDayCount)) {
		const dateKey = getDateKey(day);
		if (isAgendaDayLoaded(agenda, dateKey)) {
			map.set(dateKey, agenda[dateKey] ?? []);
		}
	}
	return map;
}

export function selectionDateKey(selection: AgendaSlotSelection): string {
	return getDateKey(selection.start);
}

export function parseMeasureBounds(begin: string | null, einde: string | null): { start: Date; end: Date } | null {
	if (begin == null || einde == null) return null;
	const start = new Date(begin);
	const end = new Date(einde);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
	return { start, end };
}

export function suggestionSelectionKey(selection: AgendaSlotSelection): string {
	return `${selectionDateKey(selection)}:${selection.start.getTime()}:${selection.end.getTime()}`;
}

/** Lesson-hour span length for comparing original vs overridden reschedule picks. */
export function returnMeasureLessonHourCount(start: Date, end: Date): number {
	return lessonHourCountForRange(start, end);
}

function durationMinutes(start: Date, end: Date): number {
	const rangeStart = start <= end ? start : end;
	const rangeEnd = start <= end ? end : start;
	return Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 60_000);
}

export type RescheduleOverrideAlert =
	| { type: 'kind'; from: ReturnMeasureScheduleKind; to: ReturnMeasureScheduleKind }
	| { type: 'duration'; fromMinutes: number; toMinutes: number }
	| { type: 'hourCount'; from: number; to: number }
	| { type: 'overlapsLesson'; subjects: string[] };

/**
 * Concrete overrides vs the original measure (kind, duration, lesson-hour count, lesson overlap).
 * One entry per difference so the UI can show one alert line each.
 */
export function listRescheduleOverrideAlerts(
	originalStart: Date,
	originalEnd: Date,
	selection: AgendaSlotSelection,
	dayEntries?: readonly AgendaEntry[] | null,
): RescheduleOverrideAlert[] {
	const alerts: RescheduleOverrideAlert[] = [];
	const fromKind = returnMeasureScheduleKind(originalStart, originalEnd);
	const toKind = returnMeasureScheduleKind(selection.start, selection.end);
	if (fromKind !== toKind) alerts.push({ type: 'kind', from: fromKind, to: toKind });

	const fromMinutes = durationMinutes(originalStart, originalEnd);
	const toMinutes = durationMinutes(selection.start, selection.end);
	if (fromMinutes !== toMinutes) alerts.push({ type: 'duration', fromMinutes, toMinutes });

	const fromHours = returnMeasureLessonHourCount(originalStart, originalEnd);
	const toHours = returnMeasureLessonHourCount(selection.start, selection.end);
	if (fromHours !== toHours) alerts.push({ type: 'hourCount', from: fromHours, to: toHours });

	if (dayEntries != null) {
		const subjects = overlappingLessonSubjects(selection, dayEntries);
		if (subjects.length > 0) alerts.push({ type: 'overlapsLesson', subjects });
	}

	return alerts;
}

/**
 * Accept a user pick for reschedule. Suggestion still prefers the original shape;
 * the user may override to any slot (including over a lesson — UI warns).
 * Past days and slots that already have a return measure stay rejected.
 */
export function constrainRescheduleSelection(
	_kind: ReturnMeasureScheduleKind,
	_originalStart: Date,
	_originalEnd: Date,
	picked: AgendaSlotSelection,
	now: Date = getNow(),
	dayEntries?: readonly AgendaEntry[] | null,
): AgendaSlotSelection | null {
	if (isReturnMeasureDateInPast(picked.start, now)) return null;
	if (dayEntries != null && isBlockedByReturnMeasure(picked, dayEntries)) return null;
	return picked;
}

export type ReschedulePlannerStep =
	| { type: 'apply'; selection: AgendaSlotSelection; key: string }
	| { type: 'advance-week'; nextFocus: Date }
	| { type: 'wait' };

/** Decide the next planner action while auto-suggesting a follow-up slot. */
export function resolveReschedulePlannerStep(input: {
	originalStart: Date;
	originalEnd: Date;
	kind: ReturnMeasureScheduleKind;
	agenda: Record<string, AgendaEntry[]> | undefined;
	weekDays: Date[];
	selectedWeekDate: Date;
	isLoading: boolean;
	appliedKey: string | null;
	/** When the session cleared the selection, re-apply even if the key was seen before. */
	hasSelection: boolean;
	autoWeekAdvances: number;
	maxAutoWeekAdvances?: number;
}): ReschedulePlannerStep {
	const searchFrom = nextSchoolDay(input.originalStart);
	const agendaMap = agendaMapFromStudentAgenda(input.agenda, searchFrom);
	const suggestion = suggestReturnMeasureReschedule(input.originalStart, input.originalEnd, agendaMap);

	if (suggestion) {
		const key = suggestionSelectionKey(suggestion);
		if (input.appliedKey === key && input.hasSelection) return { type: 'wait' };
		return { type: 'apply', selection: suggestion, key };
	}

	if (input.isLoading) return { type: 'wait' };
	const maxAdvances = input.maxAutoWeekAdvances ?? 4;
	if (input.autoWeekAdvances >= maxAdvances) return { type: 'wait' };

	const searchFromKey = getDateKey(searchFrom);
	const searchableWeekDays = input.weekDays.filter((day) => getDateKey(day) >= searchFromKey);
	const nextFocus = addDays(getStartOfWeek(input.selectedWeekDate), 7);

	if (searchableWeekDays.length === 0) {
		return { type: 'advance-week', nextFocus };
	}

	const weekReady = searchableWeekDays.every((day) => isAgendaDayLoaded(input.agenda, getDateKey(day)));
	if (!weekReady) return { type: 'wait' };

	return { type: 'advance-week', nextFocus };
}
