import { describe, expect, test } from 'bun:test';
import { formatActionBadgeText } from './actionBadge';

describe('formatActionBadgeText', () => {
	test('returns empty string for zero or negative counts', () => {
		expect(formatActionBadgeText(0)).toBe('');
		expect(formatActionBadgeText(-1)).toBe('');
	});

	test('returns count as string for open registrations', () => {
		expect(formatActionBadgeText(3)).toBe('3');
		expect(formatActionBadgeText(42)).toBe('42');
		expect(formatActionBadgeText(99)).toBe('99');
	});

	test('caps at 99+', () => {
		expect(formatActionBadgeText(100)).toBe('99+');
		expect(formatActionBadgeText(500)).toBe('99+');
	});
});
