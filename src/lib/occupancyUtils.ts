import { agendaItemOverlapsLesson, getItemLocationCodes, getItemTimeRange, timeTable } from '@/lib/agendaUtils';
import { formatTime } from '@/lib/dateUtils';
import { formatLocation } from '@/lib/locationUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';

export type OccupancyChartPoint = {
	lessonRange: string;
	total: number;
	breakTotal: number;
};

function getLessonHourIndices(beginTime: string, endTime: string) {
	let begin = timeTable.findIndex((e) => beginTime >= e.begin && beginTime < e.einde);
	let end = timeTable.findIndex((e) => endTime >= e.begin && endTime < e.einde);

	if (begin < 0) begin = end;
	if (end < 0) end = begin;

	return { begin, end };
}

function incrementOccupancy(
	occupancy: Record<string, Record<string, number>>,
	locationCode: string,
	lessonRange: string,
) {
	if (!occupancy[locationCode]) {
		occupancy[locationCode] = {};
	}
	occupancy[locationCode][lessonRange] = (occupancy[locationCode][lessonRange] ?? 0) + 1;
}

function addAgendaItemToOccupancy(occupancy: Record<string, Record<string, number>>, item: AgendaItem) {
	const beginTime = formatTime(new Date(item.begin));
	const endDate = new Date(item.einde);
	endDate.setMinutes(endDate.getMinutes() - 1);
	const endTime = formatTime(endDate);

	const { begin, end } = getLessonHourIndices(beginTime, endTime);
	if (begin < 0 || end < 0) return;

	for (let i = begin; i <= end; ++i) {
		const lessonRange = `${timeTable[i].begin}-${timeTable[i].einde}`;
		for (const location of item.locaties) {
			const locationCode = formatLocation(location);
			if (locationCode) {
				incrementOccupancy(occupancy, locationCode, lessonRange);
			}
		}
	}
}

function sortOccupancyForLocation(locationOccupancy: Record<string, number>) {
	for (const slot of timeTable) {
		const lessonRange = `${slot.begin}-${slot.einde}`;
		if (!locationOccupancy[lessonRange]) {
			locationOccupancy[lessonRange] = 0;
		}
	}

	const sortedLessonRanges = Object.keys(locationOccupancy).sort((a, b) => {
		const [aStart] = a.split('-');
		const [bStart] = b.split('-');
		return aStart.localeCompare(bStart);
	});

	const sorted: Record<string, number> = {};
	for (const range of sortedLessonRanges) {
		sorted[range] = locationOccupancy[range];
	}
	return sorted;
}

/**
 * Calculates the occupancy for each location per lesson hour for a given day.
 */
export function getOccupancyForDay(students: Student[], dateKey: string): Record<string, Record<string, number>> {
	const occupancy: Record<string, Record<string, number>> = {};

	for (const student of students) {
		const agendaForDay = student.agenda?.[dateKey];
		if (!agendaForDay) continue;

		for (const item of agendaForDay) {
			addAgendaItemToOccupancy(occupancy, item);
		}
	}

	for (const location in occupancy) {
		occupancy[location] = sortOccupancyForLocation(occupancy[location]);
	}

	return occupancy;
}

function analyzeStudentLessonPresence(
	agendaForDay: AgendaItem[],
	lessonStart: string,
	lessonEnd: string,
	allLocations: string[],
) {
	let hasLessonInThisRange = false;
	let hasLessonBefore = false;
	let hasLessonAfter = false;

	for (const item of agendaForDay) {
		const { startTime: itemStartTime, endTime: itemEndTime } = getItemTimeRange(item);

		if (agendaItemOverlapsLesson(item, lessonStart, lessonEnd)) {
			const itemLocations = getItemLocationCodes(item);
			if (itemLocations.some((loc) => allLocations.includes(loc))) {
				hasLessonInThisRange = true;
			}
		}

		if (itemEndTime <= lessonStart) hasLessonBefore = true;
		if (itemStartTime >= lessonEnd) hasLessonAfter = true;
	}

	return { hasLessonInThisRange, hasLessonBefore, hasLessonAfter };
}

export function countStudentsForLessonRange(
	lessonRange: string,
	students: Student[],
	todayKey: string,
	allLocations: string[],
): Pick<OccupancyChartPoint, 'total' | 'breakTotal'> {
	const uniqueStudentIds = new Set<number>();
	const uniqueBreakStudentIds = new Set<number>();
	const [lessonStart, lessonEnd] = lessonRange.split('-') as [string, string];

	for (const student of students) {
		const agendaForDay = student.agenda?.[todayKey];
		if (!agendaForDay?.length) continue;

		const { hasLessonInThisRange, hasLessonBefore, hasLessonAfter } = analyzeStudentLessonPresence(
			agendaForDay,
			lessonStart,
			lessonEnd,
			allLocations,
		);

		if (hasLessonInThisRange) uniqueStudentIds.add(student.id);
		if (!hasLessonInThisRange && hasLessonBefore && hasLessonAfter) {
			uniqueBreakStudentIds.add(student.id);
		}
	}

	return { total: uniqueStudentIds.size, breakTotal: uniqueBreakStudentIds.size };
}
