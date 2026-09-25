import { describe, expect, test } from 'bun:test';
import {
	dayOffsetFromIsoInstant,
	dayOffsetFromToday,
	eachMonthKey,
	getDateKey,
	getMonthKey,
	getMonthRange,
	getWorkWeekRange,
	isLocalTimeLabel,
	parseDateKey,
	weekOffsetFromDate,
} from './dateUtils';

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

describe('getWorkWeekRange', () => {
	test('returns Monday through Friday of the containing week', () => {
		const { start, end } = getWorkWeekRange(parseDateKey('2026-09-16'));

		expect(getDateKey(start)).toBe('2026-09-14');
		expect(getDateKey(end)).toBe('2026-09-18');
	});
});

describe('weekOffsetFromDate', () => {
	test('is zero for the current week', () => {
		const now = parseDateKey('2026-09-09');
		expect(weekOffsetFromDate(now, now)).toBe(0);
		expect(weekOffsetFromDate(parseDateKey('2026-09-11'), now)).toBe(0);
	});

	test('counts whole weeks forwards and backwards', () => {
		const now = parseDateKey('2026-09-09');
		expect(weekOffsetFromDate(parseDateKey('2026-09-14'), now)).toBe(1);
		expect(weekOffsetFromDate(parseDateKey('2026-09-02'), now)).toBe(-1);
	});
});

describe('isLocalTimeLabel', () => {
	test('accepts valid HH:mm values', () => {
		expect(isLocalTimeLabel('08:00')).toBe(true);
		expect(isLocalTimeLabel('14:40')).toBe(true);
	});

	test('rejects malformed or out-of-range times', () => {
		expect(isLocalTimeLabel('8:00')).toBe(false);
		expect(isLocalTimeLabel('25:00')).toBe(false);
		expect(isLocalTimeLabel('12:60')).toBe(false);
	});
});

describe('dayOffsetFromToday', () => {
	test('counts whole local calendar days relative to a reference day', () => {
		const today = parseDateKey('2026-09-16');
		expect(dayOffsetFromToday(parseDateKey('2026-09-18'), today)).toBe(2);
		expect(dayOffsetFromToday(parseDateKey('2026-09-14'), today)).toBe(-2);
	});
});

describe('dayOffsetFromIsoInstant', () => {
	test('maps a return-on ISO instant to a day offset', () => {
		const today = parseDateKey('2026-09-16');
		expect(dayOffsetFromIsoInstant('2026-09-18T10:00:00.000Z', today)).toBe(2);
	});

	test('returns null for invalid instants', () => {
		expect(dayOffsetFromIsoInstant('not-a-date')).toBeNull();
	});
});
