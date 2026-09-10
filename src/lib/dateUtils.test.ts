import { describe, expect, test } from 'bun:test';
import { eachMonthKey, getDateKey, getMonthKey, getMonthRange, parseDateKey } from './dateUtils';

describe('getMonthRange', () => {
	test('spans the first through the last local day of the month', () => {
		const { start, end } = getMonthRange(parseDateKey('2026-09-09'));

		expect(getDateKey(start)).toBe('2026-09-01');
		expect(getDateKey(end)).toBe('2026-09-30');
	});

	test('handles February in a leap year', () => {
		expect(getDateKey(getMonthRange(parseDateKey('2028-02-10')).end)).toBe('2028-02-29');
	});
});

describe('eachMonthKey', () => {
	test('lists every month a range touches', () => {
		expect(eachMonthKey(parseDateKey('2026-11-28'), parseDateKey('2027-01-04'))).toEqual([
			'2026-11',
			'2026-12',
			'2027-01',
		]);
	});

	test('returns a single month when the range stays inside it', () => {
		expect(eachMonthKey(parseDateKey('2026-09-01'), parseDateKey('2026-09-30'))).toEqual(['2026-09']);
		expect(getMonthKey(parseDateKey('2026-09-30'))).toBe('2026-09');
	});
});
