import { expect, test } from 'bun:test';
import type { AbsenceNotice } from '@/magister/response/absence-notice.types';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { ReturnMeasure } from '@/magister/response/return-measure.types';
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
	returnMeasureEntry,
} from './agendaEntryUtils';
import { getDateKey, parseDateKey, toISOFromDateKeyAndTime } from './dateUtils';

const creator = {
	accountId: '11111111-1111-4111-8111-111111111111',
	role: 'Parent',
	initials: 'AM',
	lastName: 'Boyer',
	infix: '',
};

function notice(partial: Partial<AbsenceNotice> & Pick<AbsenceNotice, 'startDateTime' | 'endDateTime'>): AbsenceNotice {
	return {
		id: 'af0cf7e7-b522-4ba9-9f65-6de88bd259d0',
		attendanceTypeCode: 'D',
		attendanceTypeDesc: 'Dokter, Huisarts',
		creator,
		modifiedBy: null,
		lastModified: null,
		recurrence: null,
		attachment: null,
		signals: [],
		...partial,
	};
}

function lesson(begin: string, einde: string): AgendaItem {
	return {
		id: 1,
		heeftInhoud: false,
		heeftAantekening: false,
		onderwijstijd: 0,
		subtype: 'nvt',
		heeftBijlagen: false,
		herhaalStatus: 'geen',
		begin,
		einde,
		onderwerp: 'Nederlands',
		type: 'les',
		deelnames: [],
		vakken: [],
		locaties: [],
		links: {},
	};
}

function returnMeasure(begin: string, einde: string): ReturnMeasure {
	return {
		id: 42,
		begin,
		einde,
		omschrijving: 'test',
		maatregel: null,
		links: {},
	};
}

test('isAbsenceNoticeEntry keeps full notice payload', () => {
	const entries = absenceNoticeEntries(
		notice({
			startDateTime: toISOFromDateKeyAndTime('2026-09-02', '09:20'),
			endDateTime: toISOFromDateKeyAndTime('2026-09-02', '10:00'),
			recurrence: { frequency: 'weekly' } as AbsenceNotice['recurrence'],
		}),
		parseDateKey('2026-09-02'),
		parseDateKey('2026-09-02'),
	);
	expect(entries).toHaveLength(1);
	expect(isAbsenceNoticeEntry(entries[0])).toBe(true);
	expect(entries[0].notice.attendanceTypeCode).toBe('D');
	expect(entries[0].notice.attendanceTypeDesc).toBe('Dokter, Huisarts');
	expect(entries[0].notice.recurrence).toEqual({ frequency: 'weekly' });
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
	const entries = absenceNoticeEntries(
		notice({
			attendanceTypeCode: 'ZK',
			attendanceTypeDesc: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime('2026-09-01', '00:00'),
			endDateTime: null,
		}),
		parseDateKey('2026-09-01'),
		parseDateKey('2026-09-03'),
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
	const sick = absenceNoticeEntries(
		notice({
			attendanceTypeCode: 'ZK',
			attendanceTypeDesc: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime('2026-09-02', '08:30'),
			endDateTime: null,
		}),
		parseDateKey('2026-09-02'),
		parseDateKey('2026-09-02'),
	)[0];
	const at = new Date(toISOFromDateKeyAndTime('2026-09-02', '11:10'));
	expect(findStudentOverviewEntry(at, [lessonItem, sick])).toBe(sick);
});

test('findStudentOverviewEntry ignores an absence that has not started yet', () => {
	const lessonItem = lessonEntry(
		lesson(toISOFromDateKeyAndTime('2026-09-02', '10:50'), toISOFromDateKeyAndTime('2026-09-02', '11:30')),
	);
	const sick = absenceNoticeEntries(
		notice({
			attendanceTypeCode: 'ZK',
			attendanceTypeDesc: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime('2026-09-02', '11:20'),
			endDateTime: null,
		}),
		parseDateKey('2026-09-02'),
		parseDateKey('2026-09-02'),
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
			attendanceTypeDesc: 'Orthodontist',
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
