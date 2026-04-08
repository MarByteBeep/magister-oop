import { timeTable } from '@/lib/agendaUtils';

export function hhmmToDate(base: Date, hhmm: string) {
	const [h, m] = hhmm.split(':').map((v) => Number.parseInt(v ?? '0', 10));
	const d = new Date(base);
	d.setHours(h || 0, m || 0, 0, 0);
	return d;
}

export function getLessonDayBounds() {
	const firstRaw = timeTable[0]?.begin ?? '08:00';
	const lastRaw = timeTable[timeTable.length - 1]?.einde ?? '16:00';

	const firstHour = Number.parseInt(firstRaw.split(':')[0], 10);
	const firstLessonTime = `${String(firstHour).padStart(2, '0')}:00`;

	const lastHour = Number.parseInt(lastRaw.split(':')[0], 10);
	// Use the next full hour as max so the final visible gutter label is 16:00.
	const lastLessonTime = `${String(lastHour + 1).padStart(2, '0')}:00`;

	return { firstLessonTime, lastLessonTime };
}
