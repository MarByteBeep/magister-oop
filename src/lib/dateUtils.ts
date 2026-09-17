export function getNow() {
	const date = new Date();
	//date.setHours(date.getHours() + 24);
	return date;
}

export function getTodayKey() {
	return getDateKey(getNow());
}

export function getDateKey(date: Date) {
	// Use local date, not UTC (toISOString uses UTC which can be off by a day)
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

/** Parse a YYYY-MM-DD key as local midnight. */
export function parseDateKey(dateKey: string): Date {
	return new Date(`${dateKey}T00:00:00`);
}

/** Inclusive local calendar keys from `rangeStart` through `rangeEnd`. */
export function eachDateKey(rangeStart: Date, rangeEnd: Date): string[] {
	const keys: string[] = [];
	const current = parseDateKey(getDateKey(rangeStart));
	const last = parseDateKey(getDateKey(rangeEnd));
	while (current <= last) {
		keys.push(getDateKey(current));
		current.setDate(current.getDate() + 1);
	}
	return keys;
}

/** Local month key `YYYY-MM`. */
export function getMonthKey(date: Date): string {
	return getDateKey(date).slice(0, 7);
}

/** First and last local calendar day of the month that `date` falls in. */
export function getMonthRange(date: Date): { start: Date; end: Date } {
	const start = new Date(date.getFullYear(), date.getMonth(), 1);
	const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
	return { start, end };
}

/** Every month key touched by the inclusive range, in chronological order. */
export function eachMonthKey(rangeStart: Date, rangeEnd: Date): string[] {
	const keys: string[] = [];
	const current = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
	const last = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
	while (current <= last) {
		keys.push(getMonthKey(current));
		current.setMonth(current.getMonth() + 1);
	}
	return keys;
}

/** Parse an ISO/date string; returns null when missing or invalid. */
export function parseOptionalDate(value?: string | null): Date | null {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

/** Copy of `date` shifted by `dayOffset` local calendar days. */
export function addDays(date: Date, dayOffset: number): Date {
	const next = new Date(date);
	next.setDate(date.getDate() + dayOffset);
	return next;
}

/** Last school day when counting `schoolDayCount` weekdays from `date` (Mon–Fri), inclusive. */
export function addSchoolDays(date: Date, schoolDayCount: number): Date {
	const count = Math.max(schoolDayCount, 1);
	const result = new Date(date);
	if (count === 1) return result;

	let remaining = count - 1;
	while (remaining > 0) {
		result.setDate(result.getDate() + 1);
		const day = result.getDay();
		if (day !== 0 && day !== 6) {
			remaining--;
		}
	}
	return result;
}

/** Combine a local date key and HH:mm time into an ISO UTC string. */
export function toISOFromDateKeyAndTime(dateKey: string, time: string): string {
	const [hours, minutes] = time.split(':').map(Number);
	const date = parseDateKey(dateKey);
	date.setHours(hours, minutes, 0, 0);
	return date.toISOString();
}

export function formatTime(date: Date) {
	const hh = String(date.getHours()).padStart(2, '0');
	const mm = String(date.getMinutes()).padStart(2, '0');
	return `${hh}:${mm}`;
}

export function getAge(date: Date) {
	const today = getNow();

	let age = today.getFullYear() - date.getFullYear();
	const m = today.getMonth() - date.getMonth();

	if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
		age--;
	}

	return age;
}

/**
 * Get the Monday of the week for a given date
 */
export function getStartOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	// getDay() returns 0 for Sunday, 1 for Monday, etc.
	// We want Monday as start, so we need to go back (day - 1) days, or 6 days if Sunday
	const diff = day === 0 ? 6 : day - 1;
	d.setDate(d.getDate() - diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

/** Weeks between this week's Monday and the Monday of `date`. Negative is in the past. */
export function weekOffsetFromDate(date: Date, now: Date = getNow()): number {
	const target = getStartOfWeek(date).getTime();
	const current = getStartOfWeek(now).getTime();
	return Math.round((target - current) / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Get all weekdays (Mon-Fri) for the week containing the given date
 */
export function getWeekDays(date: Date): Date[] {
	const monday = getStartOfWeek(date);
	const days: Date[] = [];
	for (let i = 0; i < 5; i++) {
		const day = new Date(monday);
		day.setDate(monday.getDate() + i);
		days.push(day);
	}
	return days;
}

/** Monday through Friday of the week containing `date`. */
export function getWorkWeekRange(date: Date): { start: Date; end: Date } {
	const start = getStartOfWeek(date);
	return { start, end: addDays(start, 4) };
}
