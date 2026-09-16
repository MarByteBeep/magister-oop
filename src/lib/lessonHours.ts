import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { timeTable } from '@/lib/agendaUtils';
import { hhmmToDate } from '@/lib/bigCalendarUtils';
import { formatTime } from '@/lib/dateUtils';

export function findLessonIndexContainingTime(time: string): number {
	return timeTable.findIndex((slot) => time >= slot.start && time < slot.end);
}

export function findNearestLessonIndex(time: string): number {
	const containing = findLessonIndexContainingTime(time);
	if (containing >= 0) return containing;

	for (let index = 0; index < timeTable.length; index++) {
		if (time < timeTable[index].start) return index;
	}

	return timeTable.length - 1;
}

export function findLessonIndexAtEndTime(endTime: string): number {
	for (let index = timeTable.length - 1; index >= 0; index--) {
		const slot = timeTable[index];
		if (endTime > slot.start && endTime <= slot.end) return index;
	}
	return -1;
}

export function findOverlappingLessonIndexRangeByTime(
	startTime: string,
	endTime: string,
): { from: number; to: number } | null {
	const rangeStart = startTime <= endTime ? startTime : endTime;
	const rangeEnd = startTime <= endTime ? endTime : startTime;
	let from = -1;
	let to = -1;

	for (let index = 0; index < timeTable.length; index++) {
		const slot = timeTable[index];
		if (slot.start < rangeEnd && slot.end > rangeStart) {
			if (from < 0) from = index;
			to = index;
		}
	}

	if (from >= 0) return { from, to };

	const midpointMinutes = (timeToMinutes(rangeStart) + timeToMinutes(rangeEnd)) / 2;
	const nearest = findNearestLessonIndex(minutesToTime(midpointMinutes));
	return { from: nearest, to: nearest };
}

export function findOverlappingLessonIndexRangeByDate(start: Date, end: Date): { from: number; to: number } | null {
	const rangeStart = start <= end ? start : end;
	const rangeEnd = start <= end ? end : start;
	let from = -1;
	let to = -1;

	for (let index = 0; index < timeTable.length; index++) {
		const slotStart = hhmmToDate(rangeStart, timeTable[index].start);
		const slotEnd = hhmmToDate(rangeStart, timeTable[index].end);
		if (slotStart < rangeEnd && slotEnd > rangeStart) {
			if (from < 0) from = index;
			to = index;
		}
	}

	if (from >= 0) return { from, to };

	const midpoint = new Date((rangeStart.getTime() + rangeEnd.getTime()) / 2);
	const nearest = findNearestLessonIndex(formatTime(midpoint));
	return { from: nearest, to: nearest };
}

export function lessonHourNumbersFromIndexRange(range: { from: number; to: number }): number[] {
	const hours: number[] = [];
	for (let index = range.from; index <= range.to; index++) {
		hours.push(index + 1);
	}
	return hours;
}

/** Lesson hours physically covered by a time range (selection snapping and calendar preview). */
export function getOverlappingLessonHours(startTime: string, endTime: string): number[] {
	const range = findOverlappingLessonIndexRangeByTime(startTime, endTime);
	if (!range) return [];
	return lessonHourNumbersFromIndexRange(range);
}

export function getOverlappingLessonHoursForSelection(selection: { start: Date; end: Date }): number[] {
	const range = findOverlappingLessonIndexRangeByDate(selection.start, selection.end);
	if (!range) return [];
	return lessonHourNumbersFromIndexRange(range);
}

/** Lesson hours for return-measure copy: a mid-period start counts from the next hour. */
export function getReturnMeasureLessonHours(startTime: string, endTime: string): number[] {
	let startIndex = findLessonIndexContainingTime(startTime);
	const endIndex = findLessonIndexAtEndTime(endTime);
	if (startIndex < 0 && endIndex < 0) return [];
	if (startIndex < 0) startIndex = endIndex;

	if (startIndex >= 0 && startTime > timeTable[startIndex].start) {
		startIndex += 1;
	}

	const from = startIndex;
	const to = endIndex >= 0 ? endIndex : startIndex;
	if (from > to) return [];

	return lessonHourNumbersFromIndexRange({ from, to });
}

export function snapSelectionToLessonHours(selection: { start: Date; end: Date }): AgendaSlotSelection | null {
	const range = findOverlappingLessonIndexRangeByDate(selection.start, selection.end);
	if (!range) return null;

	const rangeStart = selection.start <= selection.end ? selection.start : selection.end;
	const rangeEnd = selection.start <= selection.end ? selection.end : selection.start;

	return {
		start: hhmmToDate(rangeStart, timeTable[range.from].start),
		end: hhmmToDate(rangeEnd, timeTable[range.to].end),
	};
}

export function formatLessonHoursCompact(hours: number[]): string | null {
	if (hours.length === 0) return null;
	if (hours.length === 1) return `${hours[0]}e uur`;
	return `${hours[0]}e t/m ${hours[hours.length - 1]}e uur`;
}

export function formatLessonHoursLabel(hours: number[]): string | null {
	if (hours.length === 0) return null;

	const ordinals = hours.map((hour) => `${hour}e`);
	if (ordinals.length === 1) return `het ${ordinals[0]} uur`;
	if (ordinals.length === 2) return `het ${ordinals[0]} en ${ordinals[1]} uur`;
	return `het ${ordinals.slice(0, -1).join(', ')} en ${ordinals[ordinals.length - 1]} uur`;
}

function timeToMinutes(time: string): number {
	const [hours, minutes] = time.split(':').map(Number);
	return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = Math.round(totalMinutes % 60);
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
