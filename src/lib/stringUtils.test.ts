import { describe, expect, test } from 'bun:test';
import { formatPersonName, getInitials, normalizeString } from './stringUtils';

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
