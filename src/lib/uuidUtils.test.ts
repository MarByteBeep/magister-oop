import { describe, expect, test } from 'bun:test';
import { compactUuid } from './uuidUtils';

describe('compactUuid', () => {
	test('strips dashes so student ids match the platform API format', () => {
		expect(compactUuid('e3ef6285-99ae-43bf-9361-6f23b2759aa1')).toBe('e3ef628599ae43bf93616f23b2759aa1');
	});

	test('lowercases and leaves already compact ids untouched', () => {
		expect(compactUuid('E3EF628599AE43BF93616F23B2759AA1')).toBe('e3ef628599ae43bf93616f23b2759aa1');
	});
});
