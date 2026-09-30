import { describe, expect, test } from 'bun:test';
import { filterAttendanceTypes } from '@/lib/absence-notice/filterAttendanceTypes';
import type { AttendanceType } from '@/magister/response/attendanceType.types';

function type(code: string, description: string): AttendanceType {
	return {
		code,
		description,
		commentMandatory: false,
		attachmentAllowed: false,
	};
}

describe('filterAttendanceTypes', () => {
	const types = [type('D', 'Huisarts'), type('AR', 'Aangepast Rooster'), type('Z', 'Ziek'), type('A', 'Afwezig')];

	test('empty query keeps original order', () => {
		expect(filterAttendanceTypes(types, '').map((t) => t.code)).toEqual(['D', 'AR', 'Z', 'A']);
		expect(filterAttendanceTypes(types, '   ').map((t) => t.code)).toEqual(['D', 'AR', 'Z', 'A']);
	});

	test('code matches rank above description substring matches', () => {
		expect(filterAttendanceTypes(types, 'AR').map((t) => t.code)).toEqual(['AR', 'D']);
		expect(filterAttendanceTypes(types, 'ar').map((t) => t.code)).toEqual(['AR', 'D']);
	});

	test('exact code beats code prefix', () => {
		expect(filterAttendanceTypes(types, 'A').map((t) => t.code)).toEqual(['A', 'AR', 'D']);
	});

	test('unrelated query returns empty', () => {
		expect(filterAttendanceTypes(types, 'xyz')).toEqual([]);
	});
});
