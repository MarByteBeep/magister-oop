import { describe, expect, test } from 'bun:test';
import { isCompleteSchoolTab, isLoginSuccessorTabId, isSchoolSessionUrl } from './tabs';

describe('isSchoolSessionUrl', () => {
	test('accepts a school Magister SPA host', () => {
		expect(isSchoolSessionUrl('https://sghetstreek.magister.net/')).toBe(true);
		expect(isSchoolSessionUrl('https://sghetstreek.magister.net/magister/#/agenda')).toBe(true);
	});

	test('rejects identity, marketing, and platform hosts', () => {
		expect(isSchoolSessionUrl('https://accounts.magister.net/account/login')).toBe(false);
		expect(isSchoolSessionUrl('https://www.magister.net/')).toBe(false);
		expect(isSchoolSessionUrl('https://attendance.magister.net/api/v2/absence-notices/today')).toBe(false);
		expect(isSchoolSessionUrl('https://lockers.magister.net/api/v1/lockers/details')).toBe(false);
		expect(isSchoolSessionUrl('https://magister.net/')).toBe(false);
	});

	test('rejects extra subdomains and invalid URLs', () => {
		expect(isSchoolSessionUrl('https://cdn.school.magister.net/')).toBe(false);
		expect(isSchoolSessionUrl('https://school.magister.net.evil.example/')).toBe(false);
		expect(isSchoolSessionUrl('not a url')).toBe(false);
	});
});

describe('isCompleteSchoolTab', () => {
	test('requires a finished school SPA tab', () => {
		expect(
			isCompleteSchoolTab({ url: 'https://sghetstreek.magister.net/magister/#/agenda', status: 'complete' }),
		).toBe(true);
		expect(isCompleteSchoolTab({ url: 'https://sghetstreek.magister.net/', status: 'loading' })).toBe(false);
		expect(isCompleteSchoolTab({ url: 'https://accounts.magister.net/account/login', status: 'complete' })).toBe(
			false,
		);
		expect(isCompleteSchoolTab({ url: 'https://www.magister.net/', status: 'complete' })).toBe(false);
	});
});

describe('isLoginSuccessorTabId', () => {
	test('rejects a school tab that was already open when the wait started', () => {
		expect(isLoginSuccessorTabId(1, new Set([1]), undefined)).toBe(false);
		expect(isLoginSuccessorTabId(1, new Set([1]), 5)).toBe(false);
	});

	test('accepts a school tab opened after the wait started', () => {
		expect(isLoginSuccessorTabId(2, new Set([1]), undefined)).toBe(true);
		expect(isLoginSuccessorTabId(2, new Set([1]), 5)).toBe(true);
	});

	test('accepts the remembered login tab even if it was already a school SPA', () => {
		expect(isLoginSuccessorTabId(1, new Set([1]), 1)).toBe(true);
	});
});
