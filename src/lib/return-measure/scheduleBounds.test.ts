import { describe, expect, test } from 'bun:test';
import {
	clampReturnMeasureDay,
	earliestReturnMeasureDay,
	isReturnMeasureDateInPast,
} from '@/lib/return-measure/scheduleBounds';
import { getDateKey, parseDateKey } from '@/lib/shared/dateUtils';

describe('isReturnMeasureDateInPast', () => {
	const now = parseDateKey('2026-10-07');

	test('rejects earlier calendar days', () => {
		expect(isReturnMeasureDateInPast('2026-10-06', now)).toBe(true);
		expect(isReturnMeasureDateInPast(parseDateKey('2026-10-06'), now)).toBe(true);
	});

	test('allows today and future days', () => {
		expect(isReturnMeasureDateInPast('2026-10-07', now)).toBe(false);
		expect(isReturnMeasureDateInPast('2026-10-08', now)).toBe(false);
	});
});

describe('clampReturnMeasureDay', () => {
	const now = parseDateKey('2026-10-07');

	test('keeps future days unchanged', () => {
		const day = parseDateKey('2026-10-09');
		expect(getDateKey(clampReturnMeasureDay(day, now))).toBe('2026-10-09');
	});

	test('lifts past days to today', () => {
		expect(getDateKey(clampReturnMeasureDay(parseDateKey('2026-10-01'), now))).toBe('2026-10-07');
		expect(getDateKey(earliestReturnMeasureDay(now))).toBe('2026-10-07');
	});
});
