import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { addSchoolDays, formatTime } from '@/lib/dateUtils';
import { formatLessonHoursLabel, getReturnMeasureLessonHours } from '@/lib/lessonHours';

const DAY_NAMES = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'] as const;
const MONTH_NAMES = [
	'januari',
	'februari',
	'maart',
	'april',
	'mei',
	'juni',
	'juli',
	'augustus',
	'september',
	'oktober',
	'november',
	'december',
] as const;

function formatSingleReturnDate(date: Date): string {
	return `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function formatReturnDateRange(start: Date, end: Date): string {
	const startLabel = `${DAY_NAMES[start.getDay()]} ${start.getDate()} ${MONTH_NAMES[start.getMonth()]}`;
	const endLabel = `${DAY_NAMES[end.getDay()]} ${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`;

	if (start.getFullYear() === end.getFullYear()) {
		return `${startLabel} - ${endLabel} ${end.getFullYear()}`;
	}

	return `${formatSingleReturnDate(start)} - ${formatSingleReturnDate(end)}`;
}

export function formatReturnMeasureSummary(selection: AgendaSlotSelection, dayCount: number): string {
	const startDate = selection.start;
	const endDate = addSchoolDays(startDate, dayCount);
	const startTime = formatTime(selection.start);
	const endTime = formatTime(selection.end);
	const timeRange = `${startTime} - ${endTime}`;
	const lessonHours = formatLessonHoursLabel(getReturnMeasureLessonHours(startTime, endTime));
	const lessonSuffix = lessonHours ? ` (${lessonHours})` : '';

	if (dayCount <= 1) {
		return `Terugkomen op ${formatSingleReturnDate(startDate)} om ${timeRange}${lessonSuffix}`;
	}

	return `Terugkomen van ${formatReturnDateRange(startDate, endDate)} om ${timeRange}${lessonSuffix}`;
}
