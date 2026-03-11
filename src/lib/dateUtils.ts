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

export function formatTime(date: Date) {
	const hh = String(date.getHours()).padStart(2, '0');
	const mm = String(date.getMinutes()).padStart(2, '0');
	return `${hh}:${mm}`;
}

export function format(date: Date, format: string): string {
	const yyyy = String(date.getFullYear());
	const MM = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed for some strange reason
	const dd = String(date.getDate()).padStart(2, '0');
	const HH = String(date.getHours()).padStart(2, '0');
	const mm = String(date.getMinutes()).padStart(2, '0');
	const ss = String(date.getSeconds()).padStart(2, '0');

	return format
		.replace('yyyy', yyyy)
		.replace('MM', MM)
		.replace('dd', dd)
		.replace('HH', HH)
		.replace('mm', mm)
		.replace('ss', ss);
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

/**
 * Get the Friday of the week for a given date
 */
export function getEndOfWeek(date: Date): Date {
	const monday = getStartOfWeek(date);
	const friday = new Date(monday);
	friday.setDate(monday.getDate() + 4);
	friday.setHours(23, 59, 59, 999);
	return friday;
}

/**
 * Get short Dutch day name (ma, di, wo, do, vr, za, zo)
 */
export function getDayNameShort(date: Date): string {
	const days = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
	return days[date.getDay()];
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
