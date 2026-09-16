import { describe, expect, test } from 'bun:test';
import { parseLocalDateAndTime } from '@/lib/agendaSlotSelection';
import {
	formatLessonHoursCompact,
	formatLessonHoursLabel,
	getLessonGridLinePercents,
	getLessonHourBadgePlacements,
	getOverlappingLessonHours,
	getOverlappingLessonHoursForSelection,
	getReturnMeasureLessonHours,
	snapSelectionToLessonHours,
} from '@/lib/lessonHours';

function at(dateKey: string, time: string): Date {
	const date = parseLocalDateAndTime(dateKey, time);
	if (!date) throw new Error(`Invalid fixture date: ${dateKey} ${time}`);
	return date;
}

describe('snapSelectionToLessonHours', () => {
	test('snaps a click before school start to the pre-school slot', () => {
		const snapped = snapSelectionToLessonHours({
			start: at('2026-09-16', '08:10'),
			end: at('2026-09-16', '08:20'),
		});

		expect(snapped).toEqual({
			start: at('2026-09-16', '08:00'),
			end: at('2026-09-16', '08:30'),
		});
		expect(getOverlappingLessonHoursForSelection(snapped!)).toEqual([]);
	});

	test('snaps a click inside one lesson to that full lesson hour', () => {
		const snapped = snapSelectionToLessonHours({
			start: at('2026-09-16', '08:45'),
			end: at('2026-09-16', '09:00'),
		});

		expect(snapped).toEqual({
			start: at('2026-09-16', '08:30'),
			end: at('2026-09-16', '09:10'),
		});
	});

	test('snaps a whole-day drag to the full-day schedule (vierkant rooster)', () => {
		const snapped = snapSelectionToLessonHours({
			start: at('2026-09-16', '08:05'),
			end: at('2026-09-16', '15:55'),
		});

		expect(snapped).toEqual({
			start: at('2026-09-16', '08:00'),
			end: at('2026-09-16', '16:00'),
		});
		expect(getOverlappingLessonHoursForSelection(snapped!)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
	});

	test('snaps a drag across two lesson hours', () => {
		const snapped = snapSelectionToLessonHours({
			start: at('2026-09-16', '08:35'),
			end: at('2026-09-16', '09:45'),
		});

		expect(snapped).toEqual({
			start: at('2026-09-16', '08:30'),
			end: at('2026-09-16', '09:50'),
		});
		expect(getOverlappingLessonHoursForSelection(snapped!)).toEqual([1, 2]);
	});

	test('snaps a reversed drag the same as forward drag', () => {
		const forward = snapSelectionToLessonHours({
			start: at('2026-09-16', '09:15'),
			end: at('2026-09-16', '10:05'),
		});
		const reverse = snapSelectionToLessonHours({
			start: at('2026-09-16', '10:05'),
			end: at('2026-09-16', '09:15'),
		});

		expect(reverse).toEqual(forward);
		expect(getOverlappingLessonHoursForSelection(forward!)).toEqual([2, 3]);
		expect(formatLessonHoursCompact(getOverlappingLessonHoursForSelection(forward!))).toBe('2e t/m 3e uur');
	});
});

describe('getReturnMeasureLessonHours', () => {
	test('maps a multi-hour selection to lesson numbers', () => {
		expect(getReturnMeasureLessonHours('09:30', '11:30')).toEqual([3, 4]);
	});

	test('maps a single-hour selection to one lesson number', () => {
		expect(getReturnMeasureLessonHours('09:50', '10:30')).toEqual([3]);
	});
});

describe('getOverlappingLessonHours', () => {
	test('includes every lesson hour touched by the range', () => {
		expect(getOverlappingLessonHours('09:30', '11:30')).toEqual([2, 3, 4]);
	});
});

describe('getLessonHourBadgePlacements', () => {
	test('positions each lesson hour badge within a multi-hour selection', () => {
		const selection = snapSelectionToLessonHours({
			start: at('2026-09-16', '09:15'),
			end: at('2026-09-16', '11:15'),
		});

		const placements = getLessonHourBadgePlacements(selection!);
		expect(placements.map((placement) => placement.lessonHour)).toEqual([2, 3, 4]);
		expect(placements[0]).toEqual({ lessonHour: 2, topPercent: 0, heightPercent: (40 / 140) * 100 });
		expect(placements[1]).toEqual({
			lessonHour: 3,
			topPercent: (40 / 140) * 100,
			heightPercent: (40 / 140) * 100,
		});
		expect(placements[2]).toEqual({
			lessonHour: 4,
			topPercent: (100 / 140) * 100,
			heightPercent: (40 / 140) * 100,
		});
	});
});

describe('getLessonGridLinePercents', () => {
	test('returns a line at each lesson start and end between min and max', () => {
		const min = at('2026-09-16', '08:00');
		const max = at('2026-09-16', '17:00');
		const percents = getLessonGridLinePercents(min, max);

		expect(percents[0]).toBeCloseTo((30 / 540) * 100, 4);
		expect(percents).toContainEqual(expect.closeTo((70 / 540) * 100, 4));
		expect(percents.at(-1)).toBeCloseTo((480 / 540) * 100, 4);
		expect(percents).toHaveLength(13);
	});
});

describe('formatLessonHoursLabel', () => {
	test('formats one or two lesson hours in Dutch', () => {
		expect(formatLessonHoursLabel([3])).toBe('het 3e uur');
		expect(formatLessonHoursLabel([3, 4])).toBe('het 3e en 4e uur');
		expect(formatLessonHoursLabel([3, 4, 5])).toBe('het 3e, 4e en 5e uur');
	});
});
