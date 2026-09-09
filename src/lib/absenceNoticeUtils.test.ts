import { describe, expect, test } from 'bun:test';
import type { AbsenceNotice } from '@/magister/response/absence-notice.types';
import {
	absenceNoticeOverlapsDate,
	absenceNoticeRangeEndMs,
	expectedEndLabel,
	noticesForStudent,
	uniqueNotices,
} from './absenceNoticeUtils';
import { toISOFromDateKeyAndTime } from './dateUtils';
import { compactUuid } from './uuidUtils';

const studentId = '88fb9576-7670-4661-aed2-75a547cf319f';

function notice(partial: Partial<AbsenceNotice> = {}): AbsenceNotice {
	return {
		absenceNoticeId: 'af0cf7e7-b522-4ba9-9f65-6de88bd259d0',
		attendanceTypeCode: 'D',
		attendanceTypeDescription: 'Dokter, Huisarts',
		startDateTime: toISOFromDateKeyAndTime('2026-09-02', '09:20'),
		endDateTime: toISOFromDateKeyAndTime('2026-09-02', '10:00'),
		expectedEndDateTime: null,
		createdDateTime: '2026-09-01T12:00:00.000Z',
		consecutiveDays: 1,
		student: {
			id: studentId,
			firstName: 'Ada',
			lastName: 'Boyer',
			infix: '',
			groups: ['3B1'],
			studies: ['3B'],
			zenId: 86488,
			studentNumber: 16159,
			hasPhoto: true,
		},
		unit: { id: 'af5e4311-d487-48e1-8b0f-519423e1e0ee', name: 'VP' },
		comment: '',
		internalComment: '',
		creator: {
			accountId: '11111111-1111-4111-8111-111111111111',
			role: 'Parent',
			initials: 'AM',
			lastName: 'Boyer',
			infix: '',
		},
		modifiedBy: null,
		lastModified: null,
		signals: [],
		attachment: null,
		links: [],
		isRecurring: false,
		...partial,
	};
}

describe('absenceNoticeRangeEndMs', () => {
	const nowMs = new Date(toISOFromDateKeyAndTime('2026-09-09', '12:00')).getTime();
	const endOfToday = new Date(toISOFromDateKeyAndTime('2026-09-10', '00:00')).getTime();

	test('uses expected end when it is still in the future', () => {
		const expectedEnd = toISOFromDateKeyAndTime('2026-09-11', '16:00');
		expect(
			absenceNoticeRangeEndMs(
				notice({
					endDateTime: null,
					expectedEndDateTime: expectedEnd,
				}),
				nowMs,
			),
		).toBe(new Date(expectedEnd).getTime());
	});

	test('clips to end of today when expected end is on a previous day', () => {
		expect(
			absenceNoticeRangeEndMs(
				notice({
					endDateTime: null,
					expectedEndDateTime: toISOFromDateKeyAndTime('2026-09-08', '16:00'),
				}),
				nowMs,
			),
		).toBe(endOfToday);
	});

	test('keeps past expected end on the same calendar day', () => {
		const expectedEnd = toISOFromDateKeyAndTime('2026-09-09', '12:00');
		const justAfter = new Date(toISOFromDateKeyAndTime('2026-09-09', '12:01')).getTime();
		expect(
			absenceNoticeRangeEndMs(
				notice({
					endDateTime: null,
					expectedEndDateTime: expectedEnd,
				}),
				justAfter,
			),
		).toBe(new Date(expectedEnd).getTime());
	});

	test('prefers the actual end over the expected end', () => {
		const actualEnd = toISOFromDateKeyAndTime('2026-09-02', '10:00');
		expect(
			absenceNoticeRangeEndMs(
				notice({
					endDateTime: actualEnd,
					expectedEndDateTime: toISOFromDateKeyAndTime('2026-09-11', '16:00'),
				}),
				nowMs,
			),
		).toBe(new Date(actualEnd).getTime());
	});

	test('clips to end of today without either end when the notice already started', () => {
		expect(
			absenceNoticeRangeEndMs(
				notice({
					startDateTime: toISOFromDateKeyAndTime('2026-09-08', '08:30'),
					endDateTime: null,
					expectedEndDateTime: null,
				}),
				nowMs,
			),
		).toBe(endOfToday);
	});

	test('extends at least through the notice start day for a future-dated open notice', () => {
		const start = toISOFromDateKeyAndTime('2026-09-10', '08:30');
		expect(
			absenceNoticeRangeEndMs(
				notice({
					startDateTime: start,
					endDateTime: null,
					expectedEndDateTime: null,
				}),
				nowMs,
			),
		).toBe(new Date(toISOFromDateKeyAndTime('2026-09-11', '00:00')).getTime());
	});

	test('ignores an expected end that is before the notice start', () => {
		const start = toISOFromDateKeyAndTime('2026-09-10', '08:30');
		expect(
			absenceNoticeRangeEndMs(
				notice({
					startDateTime: start,
					endDateTime: null,
					expectedEndDateTime: toISOFromDateKeyAndTime('2026-09-09', '16:00'),
				}),
				nowMs,
			),
		).toBe(new Date(toISOFromDateKeyAndTime('2026-09-11', '00:00')).getTime());
	});
});

describe('expectedEndLabel', () => {
	test('labels the expected end when there is no definitive end', () => {
		expect(
			expectedEndLabel(
				notice({
					endDateTime: null,
					expectedEndDateTime: toISOFromDateKeyAndTime('2026-09-04', '16:00'),
				}),
			),
		).toBe('4 september 16:00');
	});

	test('stays empty when the notice already has a definitive end', () => {
		expect(expectedEndLabel(notice({ expectedEndDateTime: toISOFromDateKeyAndTime('2026-09-04', '16:00') }))).toBe(
			null,
		);
	});
});

describe('absenceNoticeOverlapsDate', () => {
	test('includes a multi-day notice on each overlapping day', () => {
		const item = notice({
			startDateTime: toISOFromDateKeyAndTime('2026-08-31', '00:00'),
			endDateTime: toISOFromDateKeyAndTime('2026-09-04', '16:00'),
			consecutiveDays: 4,
		});
		expect(absenceNoticeOverlapsDate(item, '2026-09-02')).toBe(true);
		expect(absenceNoticeOverlapsDate(item, '2026-09-05')).toBe(false);
	});
});

describe('noticesForStudent', () => {
	test('matches compact and dashed student ids', () => {
		const items = [
			notice(),
			notice({
				absenceNoticeId: 'other',
				student: {
					id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
					firstName: 'Other',
					lastName: 'Student',
					infix: '',
					groups: ['3K1'],
					studies: ['3K'],
					zenId: 1,
					studentNumber: 2,
					hasPhoto: false,
				},
			}),
		];
		expect(noticesForStudent(items, compactUuid(studentId))).toHaveLength(1);
		expect(noticesForStudent(items, studentId)[0]?.absenceNoticeId).toBe('af0cf7e7-b522-4ba9-9f65-6de88bd259d0');
	});
});

describe('uniqueNotices', () => {
	test('keeps one copy when the same notice appears on multiple dates', () => {
		const item = notice({ consecutiveDays: 4 });
		expect(uniqueNotices([item, { ...item }])).toHaveLength(1);
	});
});
