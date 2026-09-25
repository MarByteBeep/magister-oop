import { absenceNoticeRangeEndMs } from '@/lib/absenceNoticeUtils';
import { eachDateKey, getNow, parseDateKey, toISOFromDateKeyAndTime } from '@/lib/dateUtils';
import { isFullDayReturnMeasureEntry } from '@/lib/fullDayScheduleUtils';
import type { AbsenceNotice } from '@/magister/response/absence-notice.types';
import type { AgendaItem, Participant } from '@/magister/response/agenda.types';
import type {
	AbsenceNoticeAgendaEntry,
	AgendaEntry,
	LessonAgendaEntry,
	ReturnMeasureAgendaEntry,
} from '@/magister/response/agenda-entry.types';
import type { ScheduledReturnMeasure } from '@/magister/response/return-measure.types';

export function isLessonEntry(entry: AgendaEntry): entry is LessonAgendaEntry {
	return entry.kind === 'lesson';
}

export function isReturnMeasureEntry(entry: AgendaEntry): entry is ReturnMeasureAgendaEntry {
	return entry.kind === 'return-measure';
}

export function isAbsenceNoticeEntry(entry: AgendaEntry): entry is AbsenceNoticeAgendaEntry {
	return entry.kind === 'absence-notice';
}

export function lessonEntry(item: AgendaItem<Participant> | AgendaItem): LessonAgendaEntry {
	return { kind: 'lesson', start: item.begin, end: item.einde, item: item as AgendaItem };
}

export function returnMeasureEntry(measure: ScheduledReturnMeasure): ReturnMeasureAgendaEntry {
	return { kind: 'return-measure', start: measure.begin, end: measure.einde, measure };
}

function entrySourceId(entry: AgendaEntry): string | number {
	switch (entry.kind) {
		case 'lesson':
			return entry.item.id;
		case 'return-measure':
			return entry.measure.id;
		case 'absence-notice':
			return entry.notice.absenceNoticeId;
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

export function agendaEntriesEqual(a: AgendaEntry[], b: AgendaEntry[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((entry, index) => {
		const other = b[index];
		return other != null && getAgendaEntryKey(entry) === getAgendaEntryKey(other);
	});
}

/** Visible school-day window; matches the first and last entries in `timeTable`. */
function schoolDayBounds(): { start: string; end: string } {
	return { start: '08:30', end: '16:00' };
}

export function absenceNoticeEntries(
	notice: AbsenceNotice,
	rangeStart: Date,
	rangeEnd: Date,
	nowMs = getNow().getTime(),
): AbsenceNoticeAgendaEntry[] {
	const noticeStartMs = new Date(notice.startDateTime).getTime();
	const noticeEndMs = absenceNoticeRangeEndMs(notice, nowMs);
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

function sortAgendaEntries(entries: AgendaEntry[]): AgendaEntry[] {
	return entries.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function buildAgendaEntries(
	agendaItems: Array<AgendaItem<Participant> | AgendaItem>,
	returnMeasures: ScheduledReturnMeasure[],
	absenceNotices: AbsenceNotice[],
	rangeStart: Date,
	rangeEnd: Date,
): AgendaEntry[] {
	return sortAgendaEntries([
		...agendaItems.map(lessonEntry),
		...returnMeasures.map(returnMeasureEntry),
		...absenceNotices.flatMap((notice) => absenceNoticeEntries(notice, rangeStart, rangeEnd)),
	]);
}

/** Swap one day's absence overlays for freshly fetched ones, keeping lessons and return measures. */
export function replaceAbsenceNoticeEntries(
	dayEntries: AgendaEntry[],
	notices: AbsenceNotice[],
	dateKey: string,
): AgendaEntry[] {
	const day = parseDateKey(dateKey);
	return sortAgendaEntries([
		...dayEntries.filter((entry) => !isAbsenceNoticeEntry(entry)),
		...notices.flatMap((notice) => absenceNoticeEntries(notice, day, day)),
	]);
}

/** Swap one day's return measure overlays for freshly fetched ones, keeping lessons and absences. */
export function replaceReturnMeasureEntries(
	dayEntries: AgendaEntry[],
	measures: ScheduledReturnMeasure[],
): AgendaEntry[] {
	return sortAgendaEntries([
		...dayEntries.filter((entry) => !isReturnMeasureEntry(entry)),
		...measures.map(returnMeasureEntry),
	]);
}

function entryCoversTime(entry: AgendaEntry, date: Date): boolean {
	return date >= new Date(entry.start) && date < new Date(entry.end);
}

function findCoveringAbsence(date: Date, entries: AgendaEntry[]): AbsenceNoticeAgendaEntry | null {
	for (const entry of entries) {
		if (!isAbsenceNoticeEntry(entry)) continue;
		if (entryCoversTime(entry, date)) return entry;
	}
	return null;
}

function findCoveringReturnMeasure(date: Date, entries: AgendaEntry[]): ReturnMeasureAgendaEntry | null {
	for (const entry of entries) {
		if (!isReturnMeasureEntry(entry)) continue;
		if (entryCoversTime(entry, date)) return entry;
	}
	return null;
}

export function findLessonEntry(date: Date, entries: AgendaEntry[]): LessonAgendaEntry | null {
	for (const entry of entries) {
		if (!isLessonEntry(entry)) continue;
		if (entryCoversTime(entry, date)) return entry;
	}
	return null;
}

export function findLessonEntryPreferringLessons(date: Date, entries: AgendaEntry[]): LessonAgendaEntry | null {
	return findLessonEntry(date, entries.filter(isLessonEntry));
}

/** Student overview slot: absence first, then lesson, otherwise a return measure covering this time. */
export function findStudentOverviewEntry(date: Date, entries: AgendaEntry[]): AgendaEntry | null {
	return (
		findCoveringAbsence(date, entries) ?? findLessonEntry(date, entries) ?? findCoveringReturnMeasure(date, entries)
	);
}

/** Active calendar slot: lesson first, otherwise full-day return measure (never absence or gutter overlay). */
export function findActiveEntryPreferringLessons(date: Date, entries: AgendaEntry[]): AgendaEntry | null {
	const lesson = findLessonEntry(date, entries);
	if (lesson) return lesson;

	for (const entry of entries) {
		if (!isReturnMeasureEntry(entry) || !isFullDayReturnMeasureEntry(entry)) continue;
		if (entryCoversTime(entry, date)) return entry;
	}
	return null;
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

function parseLessonRange(lessonRange: string): { start: string; end: string } | null {
	const [start, end] = lessonRange.split('-').map((part) => part.trim());
	if (!start || !end) return null;
	return { start, end };
}

export function findLessonEntryOverlappingLessonRange(
	entries: AgendaEntry[],
	lessonRange: string,
): LessonAgendaEntry | null {
	const range = parseLessonRange(lessonRange);
	if (!range) return null;

	for (const entry of entries) {
		if (!isLessonEntry(entry)) continue;
		if (entryOverlapsLessonRange(entry, range.start, range.end)) return entry;
	}
	return null;
}

export function findStudentOverviewEntryOverlappingLessonRange(
	entries: AgendaEntry[],
	lessonRange: string,
): AgendaEntry | null {
	const range = parseLessonRange(lessonRange);
	if (!range) return null;
	const { start: lessonStart, end: lessonEnd } = range;

	for (const entry of entries) {
		if (!isAbsenceNoticeEntry(entry)) continue;
		if (entryOverlapsLessonRange(entry, lessonStart, lessonEnd)) return entry;
	}

	const lesson = findLessonEntryOverlappingLessonRange(entries, lessonRange);
	if (lesson) return lesson;

	for (const entry of entries) {
		if (!isReturnMeasureEntry(entry)) continue;
		if (entryOverlapsLessonRange(entry, lessonStart, lessonEnd)) return entry;
	}
	return null;
}
