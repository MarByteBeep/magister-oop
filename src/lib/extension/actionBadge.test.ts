import { describe, expect, test } from 'bun:test';
import { formatActionBadgeText } from '@/lib/extension/actionBadge';

describe('formatActionBadgeText', () => {
	test('returns empty string for zero or negative counts', () => {
		expect(formatActionBadgeText(0)).toBe('');
		expect(formatActionBadgeText(-1)).toBe('');
	});

	test('caps at 99+', () => {
		expect(formatActionBadgeText(99)).toBe('99');
		expect(formatActionBadgeText(100)).toBe('99+');
		expect(formatActionBadgeText(500)).toBe('99+');
	});
});
