import { useMemo } from 'react';
import { getDateKey, getNow, getStartOfWeek, getWeekDays } from '@/lib/dateUtils';
import { formatWeekRange } from '@/lib/weekRangeUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';

export function useWeeklyAgendaWeek(weekOffset: number, student: Student | undefined) {
	const selectedWeekDate = useMemo(() => {
		const date = new Date(getNow());
		date.setDate(date.getDate() + weekOffset * 7);
		return date;
	}, [weekOffset]);

	const weekKey = useMemo(() => getDateKey(getStartOfWeek(selectedWeekDate)), [selectedWeekDate]);

	const syncRange = useMemo(() => {
		const monday = getStartOfWeek(selectedWeekDate);
		const friday = new Date(monday);
		friday.setDate(monday.getDate() + 4);
		return { start: monday, end: friday };
	}, [selectedWeekDate]);

	const weekDays = useMemo(() => getWeekDays(selectedWeekDate), [selectedWeekDate]);
	const todayKey = useMemo(() => getDateKey(getNow()), []);
	const isCurrentWeek = weekOffset === 0;

	const weekAgenda = useMemo(() => {
		const agenda: Record<string, AgendaItem[]> = {};
		for (const day of weekDays) {
			agenda[getDateKey(day)] = student?.agenda?.[getDateKey(day)] || [];
		}
		return agenda;
	}, [student?.agenda, weekDays]);

	const calendarItems = useMemo(
		() => weekDays.flatMap((day) => weekAgenda[getDateKey(day)] || []),
		[weekAgenda, weekDays],
	);

	const weekRangeText = useMemo(() => formatWeekRange(weekDays), [weekDays]);
	const hasAnyItems = Object.values(weekAgenda).some((items) => items.length > 0);

	return {
		selectedWeekDate,
		weekKey,
		syncRange,
		weekDays,
		todayKey,
		isCurrentWeek,
		weekAgenda,
		calendarItems,
		weekRangeText,
		hasAnyItems,
	};
}
