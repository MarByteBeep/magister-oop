import { describe, expect, test } from 'bun:test';
import { formatPersonName, getInitials, normalizeString, trimmedOrUndefined } from '@/lib/shared/stringUtils';

describe('trimmedOrUndefined', () => {
	test('returns trimmed text', () => {
		expect(trimmedOrUndefined('  hello  ')).toBe('hello');
	});

	test('collapses empty, whitespace, null, and undefined to undefined', () => {
		for (const value of ['', '   ', null, undefined]) {
			expect(trimmedOrUndefined(value)).toBeUndefined();
		}
	});
});

describe('formatPersonName', () => {
	test('keeps a real infix', () => {
		expect(formatPersonName('Ada', 'de', 'Boyer')).toBe('Ada de Boyer');
		expect(formatPersonName('Ada', ' van der ', 'Velden')).toBe('Ada van der Velden');
	});

	test('collapses an infix that is empty, missing, or only whitespace', () => {
		for (const infix of ['', ' ', '   ', null, undefined]) {
			expect(formatPersonName('Ada', infix, 'Boyer')).toBe('Ada Boyer');
		}
	});
});

describe('getInitials', () => {
	test('takes the first letter of the first two name parts', () => {
		expect(getInitials('Ada Boyer')).toBe('AB');
		expect(getInitials('Ada van der Velden')).toBe('AV');
		expect(getInitials('Ada')).toBe('A');
	});

	test('ignores the extra spaces a collapsed infix can leave behind', () => {
		expect(getInitials('Ada  Boyer')).toBe('AB');
		expect(getInitials('')).toBe('');
	});
});

test('normalizeString strips diacritics for search', () => {
	expect(normalizeString('Björn Çelik')).toBe('bjorn celik');
});
