import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { getPreSchoolTimeTable, getSelectableTimeTable } from '@/lib/agendaUtils';
import { hhmmToDate } from '@/lib/bigCalendarUtils';
import { formatTime } from '@/lib/dateUtils';
import { getFullDayScheduleSelection } from '@/lib/fullDayScheduleUtils';

function lessonHourNumberFromIndex(index: number): number {
	const preSchoolCount = getPreSchoolTimeTable().length;
	if (index < preSchoolCount) return 0;
	return index - preSchoolCount + 1;
}

export function findLessonIndexContainingTime(time: string): number {
	return getSelectableTimeTable().findIndex((slot) => time >= slot.start && time < slot.end);
}

export function findLessonIndexForDateTime(date: Date): number {
	return findLessonIndexContainingTime(formatTime(date));
}

export function getLessonHourDateRange(date: Date, lessonIndex: number): AgendaSlotSelection {
	const slot = getSelectableTimeTable()[lessonIndex];
	return {
		start: hhmmToDate(date, slot.start),
		end: hhmmToDate(date, slot.end),
	};
}

export function findNearestLessonIndex(time: string): number {
	const containing = findLessonIndexContainingTime(time);
	if (containing >= 0) return containing;

	const slots = getSelectableTimeTable();
	for (let index = 0; index < slots.length; index++) {
		if (time < slots[index].start) return index;
	}

	return slots.length - 1;
}

export function findLessonIndexAtEndTime(endTime: string): number {
	const slots = getSelectableTimeTable();
	for (let index = slots.length - 1; index >= 0; index--) {
		const slot = slots[index];
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

	const slots = getSelectableTimeTable();
	for (let index = 0; index < slots.length; index++) {
		const slot = slots[index];
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

	const slots = getSelectableTimeTable();
	for (let index = 0; index < slots.length; index++) {
		const slotStart = hhmmToDate(rangeStart, slots[index].start);
		const slotEnd = hhmmToDate(rangeStart, slots[index].end);
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
		const hour = lessonHourNumberFromIndex(index);
		if (hour > 0) hours.push(hour);
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

	const slots = getSelectableTimeTable();
	if (startIndex >= 0 && startTime > slots[startIndex].start) {
		startIndex += 1;
	}

	const from = startIndex;
	const to = endIndex >= 0 ? endIndex : startIndex;
	if (from > to) return [];

	return lessonHourNumbersFromIndexRange({ from, to });
}

export type LessonHourBadgePlacement = {
	lessonHour: number;
	topPercent: number;
	heightPercent: number;
};

export function getLessonHourBadgePlacements(selection: { start: Date; end: Date }): LessonHourBadgePlacement[] {
	const range = findOverlappingLessonIndexRangeByDate(selection.start, selection.end);
	if (!range) return [];

	const rangeStart = selection.start <= selection.end ? selection.start : selection.end;
	const rangeEnd = selection.start <= selection.end ? selection.end : selection.start;
	const totalMs = rangeEnd.getTime() - rangeStart.getTime();
	if (totalMs <= 0) return [];

	const placements: LessonHourBadgePlacement[] = [];
	const slots = getSelectableTimeTable();
	for (let index = range.from; index <= range.to; index++) {
		const lessonHour = lessonHourNumberFromIndex(index);
		if (lessonHour <= 0) continue;

		const slotStart = hhmmToDate(rangeStart, slots[index].start);
		const slotEnd = hhmmToDate(rangeStart, slots[index].end);
		const topMs = Math.max(0, slotStart.getTime() - rangeStart.getTime());
		const bottomMs = Math.min(totalMs, slotEnd.getTime() - rangeStart.getTime());
		const segmentMs = bottomMs - topMs;
		if (segmentMs <= 0) continue;

		placements.push({
			lessonHour,
			topPercent: (topMs / totalMs) * 100,
			heightPercent: (segmentMs / totalMs) * 100,
		});
	}

	return placements;
}

export function selectionCoversFullSchoolDay(selection: { start: Date; end: Date }): boolean {
	const range = findOverlappingLessonIndexRangeByDate(selection.start, selection.end);
	if (!range) return false;

	const firstRegularIndex = getPreSchoolTimeTable().length;
	const lastRegularIndex = getSelectableTimeTable().length - 1;
	return range.from <= firstRegularIndex && range.to >= lastRegularIndex;
}

export function snapSelectionToLessonHours(selection: { start: Date; end: Date }): AgendaSlotSelection | null {
	if (selectionCoversFullSchoolDay(selection)) {
		const rangeStart = selection.start <= selection.end ? selection.start : selection.end;
		return getFullDayScheduleSelection(rangeStart);
	}

	const range = findOverlappingLessonIndexRangeByDate(selection.start, selection.end);
	if (!range) return null;

	const rangeStart = selection.start <= selection.end ? selection.start : selection.end;
	const rangeEnd = selection.start <= selection.end ? selection.end : selection.start;

	const slots = getSelectableTimeTable();
	return {
		start: hhmmToDate(rangeStart, slots[range.from].start),
		end: hhmmToDate(rangeEnd, slots[range.to].end),
	};
}

export function getLessonGridLinePercents(min: Date, max: Date): number[] {
	const boundaries = new Set<string>();
	for (const slot of getSelectableTimeTable()) {
		boundaries.add(slot.start);
		boundaries.add(slot.end);
	}

	const totalMs = max.getTime() - min.getTime();
	if (totalMs <= 0) return [];

	return [...boundaries]
		.map((time) => ((hhmmToDate(min, time).getTime() - min.getTime()) / totalMs) * 100)
		.filter((percent) => percent > 0 && percent < 100)
		.sort((left, right) => left - right);
}

export function buildLessonGridGradient(percents: number[]): string {
	if (percents.length === 0) return 'none';

	const stops = ['transparent 0'];
	for (const percent of percents) {
		stops.push(`transparent calc(${percent}% - 0.5px)`);
		stops.push(`var(--rbc-grid) calc(${percent}% - 0.5px)`);
		stops.push(`var(--rbc-grid) calc(${percent}% + 0.5px)`);
		stops.push(`transparent calc(${percent}% + 0.5px)`);
	}
	stops.push('transparent 100%');

	return `linear-gradient(to bottom, ${stops.join(', ')})`;
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
