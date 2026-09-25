import { getCalendarVisibleStartTime, timeTable } from '@/lib/agendaUtils';

export function hhmmToDate(base: Date, hhmm: string) {
	const [h, m] = hhmm.split(':').map((v) => Number.parseInt(v ?? '0', 10));
	const d = new Date(base);
	d.setHours(h || 0, m || 0, 0, 0);
	return d;
}

export function getLessonDayBounds() {
	const lastRaw = timeTable[timeTable.length - 1]?.end ?? '16:00';
	const firstLessonTime = getCalendarVisibleStartTime();

	const lastHour = Number.parseInt(lastRaw.split(':')[0], 10);
	// Use the next full hour as max so the final visible gutter label is 16:00.
	const lastLessonTime = `${String(lastHour + 1).padStart(2, '0')}:00`;

	return { firstLessonTime, lastLessonTime };
}
