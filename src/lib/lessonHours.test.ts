import { describe, expect, test } from 'bun:test';
import { parseLocalDateAndTime } from '@/lib/agendaSlotSelection';
import {
	formatLessonHoursCompact,
	formatLessonHoursLabel,
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

describe('formatLessonHoursLabel', () => {
	test('formats one or two lesson hours in Dutch', () => {
		expect(formatLessonHoursLabel([3])).toBe('het 3e uur');
		expect(formatLessonHoursLabel([3, 4])).toBe('het 3e en 4e uur');
		expect(formatLessonHoursLabel([3, 4, 5])).toBe('het 3e, 4e en 5e uur');
	});
});
