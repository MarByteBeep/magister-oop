import { getDateKey, getNow, parseDateKey } from '@/lib/shared/dateUtils';

/** True when the local calendar day is before today (return measures may not be placed then). */
export function isReturnMeasureDateInPast(date: Date | string, now: Date = getNow()): boolean {
	const dateKey = typeof date === 'string' ? date : getDateKey(date);
	return dateKey < getDateKey(now);
}

/** Earliest local calendar day on which a return measure may be planned. */
export function earliestReturnMeasureDay(now: Date = getNow()): Date {
	return parseDateKey(getDateKey(now));
}

/** Move `day` forward to today when it would otherwise fall in the past. */
export function clampReturnMeasureDay(day: Date, now: Date = getNow()): Date {
	const earliest = earliestReturnMeasureDay(now);
	return getDateKey(day) < getDateKey(earliest) ? earliest : day;
}
