import { getFullDayScheduleLabel, isFullDayScheduleSelection } from '@/lib/agenda/fullDayScheduleUtils';
import { formatLessonHoursLabel, getReturnMeasureLessonHours } from '@/lib/agenda/lessonHours';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { addSchoolDays, formatTime } from '@/lib/shared/dateUtils';

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

/** Compact when-label: "vrijdag 9 oktober 2026 om 08:00 - 08:30". */
export function formatReturnMeasureWhen(selection: AgendaSlotSelection): string {
	const startTime = formatTime(selection.start);
	const endTime = formatTime(selection.end);
	return `${formatSingleReturnDate(selection.start)} om ${startTime} - ${endTime}`;
}

export function formatReturnMeasureSummary(selection: AgendaSlotSelection, dayCount: number): string {
	const startDate = selection.start;
	const endDate = addSchoolDays(startDate, dayCount);
	const startTime = formatTime(selection.start);
	const endTime = formatTime(selection.end);
	const timeRange = `${startTime} - ${endTime}`;
	const scheduleSuffix = isFullDayScheduleSelection(selection)
		? ` (${getFullDayScheduleLabel()})`
		: (() => {
				const lessonHours = formatLessonHoursLabel(getReturnMeasureLessonHours(startTime, endTime));
				return lessonHours ? ` (${lessonHours})` : '';
			})();

	if (dayCount <= 1) {
		return `Terugkomen op ${formatSingleReturnDate(startDate)} om ${timeRange}${scheduleSuffix}`;
	}

	return `Terugkomen van ${formatReturnDateRange(startDate, endDate)} om ${timeRange}${scheduleSuffix}`;
}
