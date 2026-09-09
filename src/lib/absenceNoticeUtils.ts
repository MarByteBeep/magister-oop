import { addDays, formatTime, getDateKey, getNow, parseDateKey } from '@/lib/dateUtils';
import { compactUuid } from '@/lib/uuidUtils';
import type { AbsenceNotice } from '@/magister/response/absence-notice.types';

/** Start of the local calendar day after `ms` — exclusive end of that calendar day. */
function endOfCalendarDayMs(ms: number): number {
	return addDays(parseDateKey(getDateKey(new Date(ms))), 1).getTime();
}

/**
 * Effective overlay end: actual end is definitive; expected end clips while still in the future
 * and after the notice start (nonsensical expected-before-start falls through to the open floor).
 * Once expected is past on a later day (or missing), use max(end of today, end of the notice start day)
 * so open notices stay visible through now without painting unknown future days, while future-dated
 * notices still cover their own start day. Past expected on the same calendar day is kept as-is so
 * the overlay does not grow mid-day when the clock crosses the prediction.
 */
export function absenceNoticeRangeEndMs(notice: AbsenceNotice, nowMs = getNow().getTime()): number {
	if (notice.endDateTime != null) return new Date(notice.endDateTime).getTime();

	const startMs = new Date(notice.startDateTime).getTime();
	if (notice.expectedEndDateTime != null) {
		const expected = new Date(notice.expectedEndDateTime).getTime();
		if (expected > startMs) {
			if (expected > nowMs) return expected;
			if (endOfCalendarDayMs(expected) === endOfCalendarDayMs(nowMs)) return expected;
		}
	}

	return Math.max(endOfCalendarDayMs(nowMs), endOfCalendarDayMs(startMs));
}

/** Expected end for display; null when the notice already has a definitive end. */
export function expectedEndLabel(notice: AbsenceNotice): string | null {
	if (notice.endDateTime != null || notice.expectedEndDateTime == null) return null;
	const date = new Date(notice.expectedEndDateTime);
	return `${date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })} ${formatTime(date)}`;
}

export function absenceNoticeOverlapsDate(notice: AbsenceNotice, dateKey: string, nowMs = getNow().getTime()): boolean {
	const dayStart = parseDateKey(dateKey).getTime();
	const dayEnd = addDays(parseDateKey(dateKey), 1).getTime();
	const start = new Date(notice.startDateTime).getTime();
	return start < dayEnd && absenceNoticeRangeEndMs(notice, nowMs) > dayStart;
}

export function noticesForStudent(notices: AbsenceNotice[], studentExterneId: string): AbsenceNotice[] {
	const wanted = compactUuid(studentExterneId);
	return notices.filter((notice) => compactUuid(notice.student.id) === wanted);
}

export function uniqueNotices(notices: AbsenceNotice[]): AbsenceNotice[] {
	const byId = new Map<string, AbsenceNotice>();
	for (const notice of notices) {
		byId.set(notice.absenceNoticeId, notice);
	}
	return Array.from(byId.values());
}
