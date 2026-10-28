import { describe, expect, test } from 'bun:test';
import {
	applyRescheduleSlotSelection,
	buildReschedulePlans,
	mergeContiguousSelections,
} from '@/lib/return-measure/rescheduleSelections';
import { formatTime, getDateKey, toISOFromDateKeyAndTime } from '@/lib/shared/dateUtils';

function selection(dateKey: string, startTime: string, endTime: string) {
	return {
		start: new Date(toISOFromDateKeyAndTime(dateKey, startTime)),
		end: new Date(toISOFromDateKeyAndTime(dateKey, endTime)),
	};
}

describe('applyRescheduleSlotSelection', () => {
	test('replace clears prior selections', () => {
		const first = selection('2026-10-08', '08:00', '08:45');
		const second = selection('2026-10-09', '09:00', '09:45');
		expect(applyRescheduleSlotSelection([first], second)).toEqual([second]);
	});

	test('additive adds a distinct slot', () => {
		const first = selection('2026-10-08', '08:00', '08:45');
		const second = selection('2026-10-09', '09:00', '09:45');
		expect(applyRescheduleSlotSelection([first], second, { additive: true })).toEqual([first, second]);
	});

	test('additive toggles an identical slot off', () => {
		const first = selection('2026-10-08', '08:00', '08:45');
		const second = selection('2026-10-09', '09:00', '09:45');
		expect(applyRescheduleSlotSelection([first, second], first, { additive: true })).toEqual([second]);
	});
});

describe('mergeContiguousSelections', () => {
	test('merges contiguous same-day hours into one part', () => {
		const hour1 = selection('2026-10-08', '08:30', '09:20');
		const hour2 = selection('2026-10-08', '09:20', '10:10');
		const parts = mergeContiguousSelections([hour2, hour1]);
		expect(parts).toHaveLength(1);
		const part = parts[0];
		expect(part).toBeDefined();
		if (!part) return;
		expect(getDateKey(part.start)).toBe('2026-10-08');
		expect(formatTime(part.start)).toBe('08:30');
		expect(formatTime(part.end)).toBe('10:10');
	});

	test('keeps a gap on the same day as separate parts', () => {
		const hour1 = selection('2026-10-08', '08:30', '09:20');
		const hour3 = selection('2026-10-08', '10:30', '11:20');
		const parts = mergeContiguousSelections([hour1, hour3]);
		expect(parts).toHaveLength(2);
	});

	test('splits selections across days', () => {
		const monday = selection('2026-10-05', '08:30', '09:20');
		const tuesday = selection('2026-10-06', '08:30', '09:20');
		const parts = mergeContiguousSelections([monday, tuesday]);
		expect(parts).toHaveLength(2);
	});
});

describe('buildReschedulePlans', () => {
	test('builds one create input per part', () => {
		const parts = [selection('2026-10-08', '08:30', '09:20'), selection('2026-10-09', '09:20', '10:10')];
		const plans = buildReschedulePlans(parts, 'Niet gemeld op 01/10/2026');
		expect(plans).toHaveLength(2);
		expect(plans[0]).toEqual({
			dateKey: '2026-10-08',
			startTime: '08:30',
			endTime: '09:20',
			description: 'Niet gemeld op 01/10/2026',
			dayCount: 1,
		});
		expect(plans[1]?.dateKey).toBe('2026-10-09');
	});

	test('returns empty when description is blank', () => {
		expect(buildReschedulePlans([selection('2026-10-08', '08:30', '09:20')], '   ')).toEqual([]);
	});
});
