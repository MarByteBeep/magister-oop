import { describe, expect, test } from 'bun:test';
import { returnMeasureSpanMonthKeys } from './returnMeasureUtils';

describe('returnMeasureSpanMonthKeys', () => {
	test('returns one month for a single-day span', () => {
		expect(returnMeasureSpanMonthKeys('2026-09-16', 1)).toEqual(['2026-09']);
	});

	test('includes every month crossed by a multi-day school span', () => {
		expect(returnMeasureSpanMonthKeys('2026-09-29', 3)).toEqual(['2026-09', '2026-10']);
	});
});
