import { describe, expect, test } from 'bun:test';
import { isMagisterSessionStatus } from './magisterSession';

describe('isMagisterSessionStatus', () => {
	test('accepts the session states', () => {
		expect(isMagisterSessionStatus('connecting')).toBe(true);
		expect(isMagisterSessionStatus('ready')).toBe(true);
		expect(isMagisterSessionStatus('cancelled')).toBe(true);
	});

	test('rejects other values', () => {
		expect(isMagisterSessionStatus('pending')).toBe(false);
		expect(isMagisterSessionStatus(undefined)).toBe(false);
	});
});
