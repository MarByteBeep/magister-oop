import { expect, test } from 'bun:test';
import type { AbsenceNotice } from '@/magister/response/absence-notice.types';
import type { AgendaItem } from '@/magister/response/agenda.types';
import { scaleLayoutToGutter, shiftLayoutForGutter } from './agendaDayLayout';
import {
	absenceNoticeEntries,
	buildAgendaEntries,
	findActiveEntryPreferringLessons,
	findStudentOverviewEntry,
	findStudentOverviewEntryOverlappingLessonRange,
	isAbsenceNoticeEntry,
	isLessonEntry,
	isReturnMeasureEntry,
	lessonEntry,
	replaceAbsenceNoticeEntries,
	returnMeasureEntry,
} from './agendaEntryUtils';
import { getDateKey, parseDateKey, toISOFromDateKeyAndTime } from './dateUtils';
import { scheduledReturnMeasure } from './returnMeasureFixtures';

const creator = {
	accountId: '11111111-1111-4111-8111-111111111111',
	role: 'Parent',
	initials: 'AM',
	lastName: 'Boyer',
	infix: '',
};

function notice(partial: Partial<AbsenceNotice> & Pick<AbsenceNotice, 'startDateTime' | 'endDateTime'>): AbsenceNotice {
	return {
		absenceNoticeId: 'af0cf7e7-b522-4ba9-9f65-6de88bd259d0',
		attendanceTypeCode: 'D',
		attendanceTypeDescription: 'Dokter, Huisarts',
		expectedEndDateTime: null,
		createdDateTime: '2026-09-01T12:00:00.000Z',
		consecutiveDays: 1,
		student: {
			id: '88fb9576-7670-4661-aed2-75a547cf319f',
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
		creator,
		modifiedBy: null,
		lastModified: null,
		signals: [],
		attachment: null,
		links: [],
		isRecurring: false,
		...partial,
	};
}

function lesson(start: string, end: string): AgendaItem {
	return {
		id: 1,
		heeftInhoud: false,
		heeftAantekening: false,
		onderwijstijd: 0,
		subtype: 'nvt',
		heeftBijlagen: false,
		herhaalStatus: 'geen',
		begin: start,
		einde: end,
		onderwerp: 'Nederlands',
		type: 'les',
		deelnames: [],
		vakken: [],
		locaties: [],
		links: {},
	};
}

function returnMeasure(start: string, end: string) {
	return scheduledReturnMeasure(start, end);
}

test('isAbsenceNoticeEntry keeps full notice payload', () => {
	const entries = absenceNoticeEntries(
		notice({
			startDateTime: toISOFromDateKeyAndTime('2026-09-02', '09:20'),
			endDateTime: toISOFromDateKeyAndTime('2026-09-02', '10:00'),
			isRecurring: true,
		}),
		parseDateKey('2026-09-02'),
		parseDateKey('2026-09-02'),
	);
	expect(entries).toHaveLength(1);
	expect(isAbsenceNoticeEntry(entries[0])).toBe(true);
	expect(entries[0].notice.attendanceTypeCode).toBe('D');
	expect(entries[0].notice.attendanceTypeDescription).toBe('Dokter, Huisarts');
	expect(entries[0].notice.isRecurring).toBe(true);
});

test('same-day doctor appointment keeps its clock times', () => {
	const start = toISOFromDateKeyAndTime('2026-09-02', '09:20');
	const end = toISOFromDateKeyAndTime('2026-09-02', '10:00');
	const entries = absenceNoticeEntries(
		notice({ startDateTime: start, endDateTime: end }),
		parseDateKey('2026-09-02'),
		parseDateKey('2026-09-02'),
	);
	expect(entries).toHaveLength(1);
	expect(entries[0].start).toBe(new Date(start).toISOString());
	expect(entries[0].end).toBe(new Date(end).toISOString());
});

test('open-ended sick notice fills school hours for each day in range', () => {
	const nowMs = new Date(toISOFromDateKeyAndTime('2026-09-03', '12:00')).getTime();
	const entries = absenceNoticeEntries(
		notice({
			attendanceTypeCode: 'ZK',
			attendanceTypeDescription: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime('2026-09-01', '00:00'),
			endDateTime: null,
		}),
		parseDateKey('2026-09-01'),
		parseDateKey('2026-09-03'),
		nowMs,
	);
	expect(entries.map((entry) => getDateKey(new Date(entry.start)))).toEqual([
		'2026-09-01',
		'2026-09-02',
		'2026-09-03',
	]);
	for (const entry of entries) {
		expect(new Date(entry.start).toISOString()).toBe(
			new Date(toISOFromDateKeyAndTime(getDateKey(new Date(entry.start)), '08:30')).toISOString(),
		);
		expect(new Date(entry.end).toISOString()).toBe(
			new Date(toISOFromDateKeyAndTime(getDateKey(new Date(entry.start)), '16:00')).toISOString(),
		);
	}
});

test('multi-day notice skips a trailing day that ends before school', () => {
	const entries = absenceNoticeEntries(
		notice({
			startDateTime: toISOFromDateKeyAndTime('2026-08-31', '09:20'),
			endDateTime: toISOFromDateKeyAndTime('2026-09-02', '08:00'),
		}),
		parseDateKey('2026-08-31'),
		parseDateKey('2026-09-02'),
	);
	expect(entries.map((entry) => getDateKey(new Date(entry.start)))).toEqual(['2026-08-31', '2026-09-01']);
});

test('expected end clips an open-ended notice while still in the future', () => {
	const nowMs = new Date(toISOFromDateKeyAndTime('2026-09-01', '12:00')).getTime();
	const entries = absenceNoticeEntries(
		notice({
			attendanceTypeCode: 'ZK',
			attendanceTypeDescription: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime('2026-09-01', '00:00'),
			endDateTime: null,
			expectedEndDateTime: toISOFromDateKeyAndTime('2026-09-02', '16:00'),
		}),
		parseDateKey('2026-09-01'),
		parseDateKey('2026-09-03'),
		nowMs,
	);
	expect(entries.map((entry) => getDateKey(new Date(entry.start)))).toEqual(['2026-09-01', '2026-09-02']);
});

test('past expected end keeps an open notice visible through today only', () => {
	const nowMs = new Date(toISOFromDateKeyAndTime('2026-09-14', '12:00')).getTime();
	const entries = absenceNoticeEntries(
		notice({
			attendanceTypeCode: 'ZK',
			attendanceTypeDescription: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime('2026-09-08', '00:00'),
			endDateTime: null,
			expectedEndDateTime: toISOFromDateKeyAndTime('2026-09-11', '16:00'),
		}),
		parseDateKey('2026-09-14'),
		parseDateKey('2026-09-15'),
		nowMs,
	);
	expect(entries.map((entry) => getDateKey(new Date(entry.start)))).toEqual(['2026-09-14']);
});

test('stale open notice does not paint days after today', () => {
	const nowMs = new Date(toISOFromDateKeyAndTime('2026-09-09', '12:00')).getTime();
	const entries = absenceNoticeEntries(
		notice({
			attendanceTypeCode: 'ZK',
			attendanceTypeDescription: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime('2026-03-02', '00:00'),
			endDateTime: null,
			expectedEndDateTime: toISOFromDateKeyAndTime('2026-03-06', '16:00'),
		}),
		parseDateKey('2026-09-07'),
		parseDateKey('2026-09-11'),
		nowMs,
	);
	expect(entries.map((entry) => getDateKey(new Date(entry.start)))).toEqual([
		'2026-09-07',
		'2026-09-08',
		'2026-09-09',
	]);
});

test('future-dated open notice still renders on its start day', () => {
	const nowMs = new Date(toISOFromDateKeyAndTime('2026-09-09', '12:00')).getTime();
	const entries = absenceNoticeEntries(
		notice({
			attendanceTypeCode: 'ZK',
			attendanceTypeDescription: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime('2026-09-10', '08:30'),
			endDateTime: null,
			expectedEndDateTime: null,
		}),
		parseDateKey('2026-09-09'),
		parseDateKey('2026-09-11'),
		nowMs,
	);
	expect(entries.map((entry) => getDateKey(new Date(entry.start)))).toEqual(['2026-09-10']);
});

test('past expected end on the same day does not grow the overlay after the clock passes', () => {
	const expectedEnd = toISOFromDateKeyAndTime('2026-09-09', '12:00');
	const before = absenceNoticeEntries(
		notice({
			attendanceTypeCode: 'ZK',
			attendanceTypeDescription: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime('2026-09-09', '08:30'),
			endDateTime: null,
			expectedEndDateTime: expectedEnd,
		}),
		parseDateKey('2026-09-09'),
		parseDateKey('2026-09-09'),
		new Date(toISOFromDateKeyAndTime('2026-09-09', '11:59')).getTime(),
	);
	const after = absenceNoticeEntries(
		notice({
			attendanceTypeCode: 'ZK',
			attendanceTypeDescription: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime('2026-09-09', '08:30'),
			endDateTime: null,
			expectedEndDateTime: expectedEnd,
		}),
		parseDateKey('2026-09-09'),
		parseDateKey('2026-09-09'),
		new Date(toISOFromDateKeyAndTime('2026-09-09', '12:01')).getTime(),
	);
	expect(before).toHaveLength(1);
	expect(after).toHaveLength(1);
	expect(before[0].end).toBe(after[0].end);
	expect(new Date(before[0].end).toISOString()).toBe(new Date(expectedEnd).toISOString());
});

test('notices outside the requested range are omitted', () => {
	const entries = absenceNoticeEntries(
		notice({
			startDateTime: toISOFromDateKeyAndTime('2026-08-01', '09:00'),
			endDateTime: toISOFromDateKeyAndTime('2026-08-01', '10:00'),
		}),
		parseDateKey('2026-09-01'),
		parseDateKey('2026-09-05'),
	);
	expect(entries).toEqual([]);
});

test('buildAgendaEntries merges lessons, return measures, and notices', () => {
	const mid = toISOFromDateKeyAndTime('2026-09-02', '09:20');
	const end = toISOFromDateKeyAndTime('2026-09-02', '10:00');
	const lessonBegin = toISOFromDateKeyAndTime('2026-09-02', '10:50');
	const merged = buildAgendaEntries(
		[lesson(lessonBegin, toISOFromDateKeyAndTime('2026-09-02', '11:30'))],
		[returnMeasure(toISOFromDateKeyAndTime('2026-09-02', '08:00'), toISOFromDateKeyAndTime('2026-09-02', '16:00'))],
		[notice({ startDateTime: mid, endDateTime: end })],
		parseDateKey('2026-09-02'),
		parseDateKey('2026-09-02'),
	);
	expect(merged).toHaveLength(3);
	expect(isReturnMeasureEntry(merged[0])).toBe(true);
	expect(isAbsenceNoticeEntry(merged[1])).toBe(true);
	expect(isLessonEntry(merged[2])).toBe(true);
	expect(merged[2].start).toBe(lessonBegin);
});

test('replaceAbsenceNoticeEntries keeps lessons and swaps overlays', () => {
	const day = '2026-09-02';
	const existing = buildAgendaEntries(
		[lesson(toISOFromDateKeyAndTime(day, '10:50'), toISOFromDateKeyAndTime(day, '11:30'))],
		[],
		[
			notice({
				startDateTime: toISOFromDateKeyAndTime(day, '09:20'),
				endDateTime: toISOFromDateKeyAndTime(day, '10:00'),
			}),
		],
		parseDateKey(day),
		parseDateKey(day),
	);
	const updated = replaceAbsenceNoticeEntries(
		existing,
		[
			notice({
				absenceNoticeId: 'new-notice',
				attendanceTypeCode: 'ZK',
				attendanceTypeDescription: 'Ziek gemeld',
				startDateTime: toISOFromDateKeyAndTime(day, '08:30'),
				endDateTime: toISOFromDateKeyAndTime(day, '16:00'),
			}),
		],
		day,
	);
	expect(updated.filter(isLessonEntry)).toHaveLength(1);
	expect(updated.filter(isAbsenceNoticeEntry)).toHaveLength(1);
	expect(updated.find(isAbsenceNoticeEntry)?.notice.absenceNoticeId).toBe('new-notice');
});

test('lessonEntry wraps agenda items without mutation', () => {
	const item = lesson('2026-09-02T10:50:00', '2026-09-02T11:30:00');
	const entry = lessonEntry(item);
	expect(entry.kind).toBe('lesson');
	expect(entry.item).toBe(item);
});

test('findStudentOverviewEntry shows a timed return measure when there is no lesson', () => {
	const measure = returnMeasureEntry(
		returnMeasure(toISOFromDateKeyAndTime('2026-09-02', '10:50'), toISOFromDateKeyAndTime('2026-09-02', '11:50')),
	);
	const at = new Date(toISOFromDateKeyAndTime('2026-09-02', '11:10'));
	expect(findStudentOverviewEntry(at, [measure])).toBe(measure);
});

test('findStudentOverviewEntry prefers a lesson over an overlapping return measure', () => {
	const lessonItem = lessonEntry(
		lesson(toISOFromDateKeyAndTime('2026-09-02', '10:50'), toISOFromDateKeyAndTime('2026-09-02', '11:30')),
	);
	const measure = returnMeasureEntry(
		returnMeasure(toISOFromDateKeyAndTime('2026-09-02', '10:50'), toISOFromDateKeyAndTime('2026-09-02', '11:50')),
	);
	const at = new Date(toISOFromDateKeyAndTime('2026-09-02', '11:10'));
	expect(findStudentOverviewEntry(at, [measure, lessonItem])).toBe(lessonItem);
});

test('findStudentOverviewEntry prefers an absence over an overlapping lesson', () => {
	const lessonItem = lessonEntry(
		lesson(toISOFromDateKeyAndTime('2026-09-02', '10:50'), toISOFromDateKeyAndTime('2026-09-02', '11:30')),
	);
	const nowMs = new Date(toISOFromDateKeyAndTime('2026-09-02', '12:00')).getTime();
	const sick = absenceNoticeEntries(
		notice({
			attendanceTypeCode: 'ZK',
			attendanceTypeDescription: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime('2026-09-02', '08:30'),
			endDateTime: null,
		}),
		parseDateKey('2026-09-02'),
		parseDateKey('2026-09-02'),
		nowMs,
	)[0];
	const at = new Date(toISOFromDateKeyAndTime('2026-09-02', '11:10'));
	expect(findStudentOverviewEntry(at, [lessonItem, sick])).toBe(sick);
});

test('findStudentOverviewEntry ignores an absence that has not started yet', () => {
	const lessonItem = lessonEntry(
		lesson(toISOFromDateKeyAndTime('2026-09-02', '10:50'), toISOFromDateKeyAndTime('2026-09-02', '11:30')),
	);
	const nowMs = new Date(toISOFromDateKeyAndTime('2026-09-02', '12:00')).getTime();
	const sick = absenceNoticeEntries(
		notice({
			attendanceTypeCode: 'ZK',
			attendanceTypeDescription: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime('2026-09-02', '11:20'),
			endDateTime: null,
		}),
		parseDateKey('2026-09-02'),
		parseDateKey('2026-09-02'),
		nowMs,
	)[0];
	const at = new Date(toISOFromDateKeyAndTime('2026-09-02', '11:10'));
	expect(findStudentOverviewEntry(at, [lessonItem, sick])).toBe(lessonItem);
});

test('findActiveEntryPreferringLessons skips timed return measures used as gutter overlays', () => {
	const measure = returnMeasureEntry(
		returnMeasure(toISOFromDateKeyAndTime('2026-09-02', '10:50'), toISOFromDateKeyAndTime('2026-09-02', '11:50')),
	);
	const at = new Date(toISOFromDateKeyAndTime('2026-09-02', '11:10'));
	expect(findActiveEntryPreferringLessons(at, [measure])).toBeNull();
});

test('findStudentOverviewEntryOverlappingLessonRange falls back to a return measure', () => {
	const measure = returnMeasureEntry(
		returnMeasure(toISOFromDateKeyAndTime('2026-09-02', '10:50'), toISOFromDateKeyAndTime('2026-09-02', '11:50')),
	);
	expect(findStudentOverviewEntryOverlappingLessonRange([measure], '10:50 - 11:30')).toBe(measure);
});

test('findStudentOverviewEntryOverlappingLessonRange prefers an absence over a lesson', () => {
	const lessonItem = lessonEntry(
		lesson(toISOFromDateKeyAndTime('2026-09-02', '10:50'), toISOFromDateKeyAndTime('2026-09-02', '11:30')),
	);
	const dentist = absenceNoticeEntries(
		notice({
			attendanceTypeCode: 'O',
			attendanceTypeDescription: 'Orthodontist',
			startDateTime: toISOFromDateKeyAndTime('2026-09-02', '10:50'),
			endDateTime: toISOFromDateKeyAndTime('2026-09-02', '12:10'),
		}),
		parseDateKey('2026-09-02'),
		parseDateKey('2026-09-02'),
	)[0];
	expect(findStudentOverviewEntryOverlappingLessonRange([lessonItem, dentist], '10:50 - 11:30')).toBe(dentist);
});

test('scaleLayoutToGutter and shiftLayoutForGutter wrap calc lengths', () => {
	const scaled = scaleLayoutToGutter(
		{ top: 10, height: 20, width: 'calc(100% - 0px)', xOffset: 'calc(0% + 0px)' },
		20,
	);
	expect(scaled.width).toBe('calc((calc(100% - 0px)) * 0.2)');
	expect(scaled.xOffset).toBe('calc((calc(0% + 0px)) * 0.2)');

	const shifted = shiftLayoutForGutter(
		{ top: 10, height: 20, width: 'calc(100% - 0px)', xOffset: 'calc(0% + 0px)' },
		20,
	);
	expect(shifted.width).toBe('calc((calc(100% - 0px)) * 0.8)');
	expect(shifted.xOffset).toBe('calc(20% + (calc(0% + 0px)) * 0.8)');
});
