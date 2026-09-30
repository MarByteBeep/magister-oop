import { describe, expect, mock, test } from 'bun:test';

mock.module('@/lib/absence-notice/attendanceTypes', () => ({
	getAttendanceType: (code: string) => {
		if (code === 'SL') {
			return {
				code: 'SL',
				description: 'Schoolleiding',
				commentMandatory: false,
				attachmentAllowed: false,
			};
		}
		if (code === 'RB') {
			return {
				code: 'RB',
				description: 'Reden bekend',
				commentMandatory: true,
				attachmentAllowed: false,
			};
		}
		return undefined;
	},
}));

const { buildCreateAbsenceNoticeRequest } = await import('@/lib/absence-notice/createRequest');

describe('buildCreateAbsenceNoticeRequest', () => {
	test('builds API request from form values', () => {
		const result = buildCreateAbsenceNoticeRequest({
			studentUuid: '00000000-0000-0000-0000-000000000001',
			dateKey: '2026-09-25',
			startTime: '11:20',
			endTime: '14:00',
			attendanceTypeCode: 'SL',
			comment: ' internationale sportwedstrijd ',
			internalComment: ' extra verlof ',
		});

		expect(result).toEqual({
			studentId: '00000000-0000-0000-0000-000000000001',
			attendanceTypeCode: 'SL',
			attendanceTypeDesc: 'Schoolleiding',
			startDateTime: expect.any(String),
			endDateTime: expect.any(String),
			comment: 'internationale sportwedstrijd',
			internalComment: 'extra verlof',
		});
	});

	test('requires comment when attendance type marks it mandatory', () => {
		expect(
			buildCreateAbsenceNoticeRequest({
				studentUuid: '00000000-0000-0000-0000-000000000001',
				dateKey: '2026-09-25',
				startTime: '11:20',
				endTime: '14:00',
				attendanceTypeCode: 'RB',
				comment: '   ',
				internalComment: '',
			}),
		).toBeNull();
	});
});
