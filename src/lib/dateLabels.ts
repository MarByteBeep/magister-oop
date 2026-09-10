const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const DAY_NAMES = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

export function formatWeekRange(weekDays: Date[]): string {
	if (weekDays.length === 0) return '';

	const firstDay = weekDays[0];
	const lastDay = weekDays[weekDays.length - 1];
	const firstDayName = DAY_NAMES[firstDay.getDay()];
	const lastDayName = DAY_NAMES[lastDay.getDay()];

	if (firstDay.getMonth() === lastDay.getMonth()) {
		return `${firstDayName} ${firstDay.getDate()} - ${lastDayName} ${lastDay.getDate()} ${MONTHS[firstDay.getMonth()]} ${firstDay.getFullYear()}`;
	}
	return `${firstDayName} ${firstDay.getDate()} ${MONTHS[firstDay.getMonth()]} - ${lastDayName} ${lastDay.getDate()} ${MONTHS[lastDay.getMonth()]} ${lastDay.getFullYear()}`;
}

/** Single day label, e.g. "woensdag 9 sep". */
export function formatDayLabel(date: Date): string {
	return `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}
