import { isLessonEntry } from '@/lib/agenda/entryUtils';
import { findOverlappingLessonIndexRangeByTime } from '@/lib/agenda/lessonHours';
import {
	agendaItemOverlapsLesson,
	getItemLocationCodes,
	getItemTimeRange,
	getSelectableTimeTable,
} from '@/lib/agenda/utils';
import { formatTime } from '@/lib/shared/dateUtils';
import { formatLocation } from '@/lib/shared/locationUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

export type OccupancyChartPoint = {
	lessonRange: string;
	total: number;
	breakTotal: number;
};

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
	const startTime = formatTime(new Date(item.begin));
	const endDate = new Date(item.einde);
	endDate.setMinutes(endDate.getMinutes() - 1);
	const endTime = formatTime(endDate);

	const range = findOverlappingLessonIndexRangeByTime(startTime, endTime);
	if (!range) return;

	const slots = getSelectableTimeTable();
	for (let i = range.from; i <= range.to; ++i) {
		const lessonRange = `${slots[i].start}-${slots[i].end}`;
		for (const location of item.locaties) {
			const locationCode = formatLocation(location);
			if (locationCode) {
				incrementOccupancy(occupancy, locationCode, lessonRange);
			}
		}
	}
}

function sortOccupancyForLocation(locationOccupancy: Record<string, number>) {
	for (const slot of getSelectableTimeTable()) {
		const lessonRange = `${slot.start}-${slot.end}`;
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

		for (const entry of agendaForDay) {
			if (!isLessonEntry(entry)) continue;
			addAgendaItemToOccupancy(occupancy, entry.item);
		}
	}

	for (const location in occupancy) {
		occupancy[location] = sortOccupancyForLocation(occupancy[location]);
	}

	return occupancy;
}

type StudentLessonPresence = {
	hasLessonInThisRange: boolean;
	hasLessonBefore: boolean;
	hasLessonAfter: boolean;
};

function itemInSelectedLocations(item: AgendaItem, locations: string[]): boolean {
	return getItemLocationCodes(item).some((loc) => locations.includes(loc));
}

function markOverlapPresence(
	presence: StudentLessonPresence,
	item: AgendaItem,
	lessonStart: string,
	lessonEnd: string,
): void {
	if (agendaItemOverlapsLesson(item, lessonStart, lessonEnd)) presence.hasLessonInThisRange = true;
}

function markAdjacentPresence(
	presence: StudentLessonPresence,
	item: AgendaItem,
	lessonStart: string,
	lessonEnd: string,
): void {
	const { startTime, endTime } = getItemTimeRange(item);
	if (endTime <= lessonStart) presence.hasLessonBefore = true;
	if (startTime >= lessonEnd) presence.hasLessonAfter = true;
}

function updatePresenceFromLessonItem(
	presence: StudentLessonPresence,
	item: AgendaItem,
	lessonStart: string,
	lessonEnd: string,
	locations: string[],
): void {
	if (!itemInSelectedLocations(item, locations)) return;
	markOverlapPresence(presence, item, lessonStart, lessonEnd);
	markAdjacentPresence(presence, item, lessonStart, lessonEnd);
}

function analyzeStudentLessonPresence(
	agendaForDay: AgendaEntry[],
	lessonStart: string,
	lessonEnd: string,
	locations: string[],
): StudentLessonPresence {
	const presence: StudentLessonPresence = {
		hasLessonInThisRange: false,
		hasLessonBefore: false,
		hasLessonAfter: false,
	};

	for (const entry of agendaForDay) {
		if (!isLessonEntry(entry)) continue;
		updatePresenceFromLessonItem(presence, entry.item, lessonStart, lessonEnd, locations);
	}

	return presence;
}

function isBreakPresence(presence: StudentLessonPresence): boolean {
	if (presence.hasLessonInThisRange) return false;
	return presence.hasLessonBefore && presence.hasLessonAfter;
}

function nonEmptyAgenda(entries: AgendaEntry[] | undefined): AgendaEntry[] | null {
	if (!entries) return null;
	if (entries.length === 0) return null;
	return entries;
}

function studentAgendaForDay(student: Student, dateKey: string): AgendaEntry[] | null {
	const days = student.agenda;
	if (!days) return null;
	return nonEmptyAgenda(days[dateKey]);
}

function presenceClass(presence: StudentLessonPresence): 'lesson' | 'break' | null {
	if (presence.hasLessonInThisRange) return 'lesson';
	if (isBreakPresence(presence)) return 'break';
	return null;
}

function classifyStudentForLessonRange(
	student: Student,
	dateKey: string,
	lessonStart: string,
	lessonEnd: string,
	locations: string[],
): 'lesson' | 'break' | null {
	const agendaForDay = studentAgendaForDay(student, dateKey);
	if (!agendaForDay) return null;
	return presenceClass(analyzeStudentLessonPresence(agendaForDay, lessonStart, lessonEnd, locations));
}

function pushStudentByPresenceClass(
	kind: 'lesson' | 'break' | null,
	student: Student,
	withLesson: Student[],
	withBreak: Student[],
): void {
	if (kind === 'lesson') withLesson.push(student);
	if (kind === 'break') withBreak.push(student);
}

export function getStudentsForLessonRange(
	lessonRange: string,
	students: Student[],
	dateKey: string,
	locations: string[],
): { withLesson: Student[]; withBreak: Student[] } {
	const withLesson: Student[] = [];
	const withBreak: Student[] = [];
	const [lessonStart, lessonEnd] = lessonRange.split('-') as [string, string];

	for (const student of students) {
		const kind = classifyStudentForLessonRange(student, dateKey, lessonStart, lessonEnd, locations);
		pushStudentByPresenceClass(kind, student, withLesson, withBreak);
	}

	return { withLesson, withBreak };
}

function recordStudentPresenceCounts(
	presence: StudentLessonPresence,
	studentId: number,
	lessonIds: Set<number>,
	breakIds: Set<number>,
): void {
	if (presence.hasLessonInThisRange) {
		lessonIds.add(studentId);
		return;
	}
	if (isBreakPresence(presence)) breakIds.add(studentId);
}

export function countStudentsForLessonRange(
	lessonRange: string,
	students: Student[],
	todayKey: string,
	locations: string[],
): Pick<OccupancyChartPoint, 'total' | 'breakTotal'> {
	const uniqueStudentIds = new Set<number>();
	const uniqueBreakStudentIds = new Set<number>();
	const [lessonStart, lessonEnd] = lessonRange.split('-') as [string, string];

	for (const student of students) {
		const agendaForDay = studentAgendaForDay(student, todayKey);
		if (!agendaForDay) continue;
		const presence = analyzeStudentLessonPresence(agendaForDay, lessonStart, lessonEnd, locations);
		recordStudentPresenceCounts(presence, student.id, uniqueStudentIds, uniqueBreakStudentIds);
	}

	return {
		total: uniqueStudentIds.size,
		breakTotal: uniqueBreakStudentIds.size,
	};
}
