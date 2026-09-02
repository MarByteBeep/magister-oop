import { getDateKey, parseDateKey, toISOFromDateKeyAndTime } from '@/lib/dateUtils';
import { isFullDayReturnMeasureEntry } from '@/lib/fullDayScheduleUtils';
import type { AbsenceNotice } from '@/magister/response/absence-notice.types';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type {
	AbsenceNoticeAgendaEntry,
	AgendaEntry,
	LessonAgendaEntry,
	ReturnMeasureAgendaEntry,
} from '@/magister/response/agenda-entry.types';
import type { ReturnMeasure } from '@/magister/response/return-measure.types';

export function isLessonEntry(entry: AgendaEntry): entry is LessonAgendaEntry {
	return entry.kind === 'lesson';
}

export function isReturnMeasureEntry(entry: AgendaEntry): entry is ReturnMeasureAgendaEntry {
	return entry.kind === 'return-measure';
}

export function isAbsenceNoticeEntry(entry: AgendaEntry): entry is AbsenceNoticeAgendaEntry {
	return entry.kind === 'absence-notice';
}

export function lessonEntry(item: AgendaItem): LessonAgendaEntry {
	return { kind: 'lesson', start: item.begin, end: item.einde, item };
}

export function returnMeasureEntry(measure: ReturnMeasure): ReturnMeasureAgendaEntry {
	return { kind: 'return-measure', start: measure.begin, end: measure.einde, measure };
}

function entrySourceId(entry: AgendaEntry): string | number {
	switch (entry.kind) {
		case 'lesson':
			return entry.item.id;
		case 'return-measure':
			return entry.measure.id;
		case 'absence-notice':
			return entry.notice.id;
	}
}

export function getAgendaEntryKey(entry: AgendaEntry): string {
	return `${entry.kind}:${entrySourceId(entry)}:${entry.start}`;
}

export function isSameAgendaEntryOccurrence(
	a: AgendaEntry | null | undefined,
	b: AgendaEntry | null | undefined,
): boolean {
	return a != null && b != null && getAgendaEntryKey(a) === getAgendaEntryKey(b);
}

/** Visible school-day window; matches the first and last entries in `timeTable`. */
function schoolDayBounds(): { start: string; end: string } {
	return { start: '08:30', end: '16:00' };
}

function eachDateKey(rangeStart: Date, rangeEnd: Date): string[] {
	const keys: string[] = [];
	const current = parseDateKey(getDateKey(rangeStart));
	const last = parseDateKey(getDateKey(rangeEnd));
	while (current <= last) {
		keys.push(getDateKey(current));
		current.setDate(current.getDate() + 1);
	}
	return keys;
}

export function absenceNoticeEntries(
	notice: AbsenceNotice,
	rangeStart: Date,
	rangeEnd: Date,
): AbsenceNoticeAgendaEntry[] {
	const noticeStartMs = new Date(notice.startDateTime).getTime();
	const noticeEndMs = notice.endDateTime ? new Date(notice.endDateTime).getTime() : Number.POSITIVE_INFINITY;
	const { start: schoolStart, end: schoolEnd } = schoolDayBounds();
	const entries: AbsenceNoticeAgendaEntry[] = [];

	for (const dateKey of eachDateKey(rangeStart, rangeEnd)) {
		const schoolStartMs = new Date(toISOFromDateKeyAndTime(dateKey, schoolStart)).getTime();
		const schoolEndMs = new Date(toISOFromDateKeyAndTime(dateKey, schoolEnd)).getTime();
		const segmentStartMs = Math.max(noticeStartMs, schoolStartMs);
		const segmentEndMs = Math.min(noticeEndMs, schoolEndMs);
		if (segmentStartMs >= segmentEndMs) continue;

		entries.push({
			kind: 'absence-notice',
			start: new Date(segmentStartMs).toISOString(),
			end: new Date(segmentEndMs).toISOString(),
			notice,
		});
	}

	return entries;
}

export function buildAgendaEntries(
	agendaItems: AgendaItem[],
	returnMeasures: ReturnMeasure[],
	absenceNotices: AbsenceNotice[],
	rangeStart: Date,
	rangeEnd: Date,
): AgendaEntry[] {
	const entries: AgendaEntry[] = [
		...agendaItems.map(lessonEntry),
		...returnMeasures.map(returnMeasureEntry),
		...absenceNotices.flatMap((notice) => absenceNoticeEntries(notice, rangeStart, rangeEnd)),
	];
	return entries.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function findLessonEntry(date: Date, entries: AgendaEntry[]): LessonAgendaEntry | null {
	for (const entry of entries) {
		if (!isLessonEntry(entry)) continue;
		const startTime = new Date(entry.start);
		const endTime = new Date(entry.end);
		if (date >= startTime && date < endTime) return entry;
	}
	return null;
}

export function findLessonEntryPreferringLessons(date: Date, entries: AgendaEntry[]): LessonAgendaEntry | null {
	return findLessonEntry(date, entries.filter(isLessonEntry));
}

/** Active calendar slot: lesson first, otherwise full-day return measure (never absence or gutter overlay). */
export function findActiveEntryPreferringLessons(date: Date, entries: AgendaEntry[]): AgendaEntry | null {
	const lesson = findLessonEntry(date, entries);
	if (lesson) return lesson;

	for (const entry of entries) {
		if (isAbsenceNoticeEntry(entry)) continue;
		if (isReturnMeasureEntry(entry) && !isFullDayReturnMeasureEntry(entry)) continue;
		const startTime = new Date(entry.start);
		const endTime = new Date(entry.end);
		if (date >= startTime && date < endTime) return entry;
	}
	return null;
}

export function findNextLessonEntry(date: Date, entries: AgendaEntry[]): LessonAgendaEntry | null {
	const futureEntries = entries.filter(isLessonEntry).filter((entry) => new Date(entry.start) > date);
	futureEntries.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
	return futureEntries[0] ?? null;
}

export function entryOverlapsLessonRange(entry: AgendaEntry, lessonStart: string, lessonEnd: string): boolean {
	const itemStart = formatEntryTime(entry.start);
	const itemEnd = formatEntryTime(entry.end);
	return (itemStart < lessonEnd && itemEnd > lessonStart) || (itemStart === lessonStart && itemEnd === lessonEnd);
}

function formatEntryTime(iso: string): string {
	const date = new Date(iso);
	const hh = String(date.getHours()).padStart(2, '0');
	const mm = String(date.getMinutes()).padStart(2, '0');
	return `${hh}:${mm}`;
}

export function findLessonEntryOverlappingLessonRange(
	entries: AgendaEntry[],
	lessonRange: string,
): LessonAgendaEntry | null {
	const [lessonStart, lessonEnd] = lessonRange.split('-').map((s) => s.trim());
	if (!lessonStart || !lessonEnd) return null;

	for (const entry of entries) {
		if (!isLessonEntry(entry)) continue;
		if (entryOverlapsLessonRange(entry, lessonStart, lessonEnd)) return entry;
	}
	return null;
}

export function findLessonEntryOverlappingLessonRangePreferringLessons(
	entries: AgendaEntry[],
	lessonRange: string,
): LessonAgendaEntry | null {
	const lesson = findLessonEntryOverlappingLessonRange(entries.filter(isLessonEntry), lessonRange);
	if (lesson) return lesson;
	return findLessonEntryOverlappingLessonRange(
		entries.filter((entry) => !isAbsenceNoticeEntry(entry)),
		lessonRange,
	);
}
