import { describe, expect, test } from 'bun:test';
import { parseDateKey, toISOFromDateKeyAndTime } from './dateUtils';
import { returnMeasureStudent, returnMeasureStudentDetails } from './returnMeasureFixtures';
import {
	buildReturnMeasureRows,
	countOpenReturnMeasuresToday,
	countReturnMeasureRowsByStatus,
	filterReturnMeasureRows,
	groupReturnMeasureRowsByDay,
	returnMeasurePeriodRange,
	returnMeasurePlanning,
	returnMeasureReportStatus,
} from './returnMeasureOverview';

const alwaysVisible = () => true;

// A Wednesday, so "this week" spans 2026-09-07 (Mon) through 2026-09-13 (Sun).
const now = parseDateKey('2026-09-09');

function measure(id: number, studentId: number, dateKey: string | null, overrides = {}) {
	return returnMeasureStudent({
		id,
		leerling: returnMeasureStudentDetails(studentId),
		begin: dateKey == null ? null : toISOFromDateKeyAndTime(dateKey, '08:30'),
		einde: dateKey == null ? null : toISOFromDateKeyAndTime(dateKey, '09:30'),
		...overrides,
	});
}

function handled(id: number, studentId: number, dateKey: string) {
	return measure(id, studentId, dateKey, { afgehandeldOp: toISOFromDateKeyAndTime(dateKey, '09:30') });
}

describe('returnMeasureReportStatus', () => {
	test('reports "not-reported" even when the measure was also reported', () => {
		expect(returnMeasureReportStatus(returnMeasureStudent({ heeftNietGemeld: true, heeftGemeld: true }))).toBe(
			'not-reported',
		);
		expect(returnMeasureReportStatus(returnMeasureStudent({ heeftGemeld: true }))).toBe('reported');
		expect(returnMeasureReportStatus(returnMeasureStudent())).toBe('none');
	});
});

describe('returnMeasurePlanning', () => {
	test('splits measures into unplanned, handled, and open', () => {
		expect(returnMeasurePlanning(measure(1, 7, null))).toBe('unplanned');
		expect(returnMeasurePlanning(handled(2, 7, '2026-09-09'))).toBe('handled');
		expect(returnMeasurePlanning(measure(3, 7, '2026-09-09'))).toBe('open');
	});

	test('an unplanned measure stays unplanned even when it was handled', () => {
		expect(returnMeasurePlanning(measure(4, 7, null, { afgehandeldOp: '2026-09-09T07:30:00.000Z' }))).toBe(
			'unplanned',
		);
	});
});

describe('buildReturnMeasureRows', () => {
	test('prefers the measure label and keeps the free text as secondary label', () => {
		const rows = buildReturnMeasureRows(
			[
				measure(1, 7, '2026-09-09', {
					maatregel: { id: 8512, omschrijving: 'Uur nakomen' },
					omschrijving: 'Te laat op 3 september',
				}),
			],
			alwaysVisible,
		);

		expect(rows).toHaveLength(1);
		expect(rows[0].primaryLabel).toBe('Uur nakomen');
		expect(rows[0].secondaryLabel).toBe('Te laat op 3 september');
		expect(rows[0].studentName).toBe('Ada Boyer');
		expect(rows[0].dateKey).toBe('2026-09-09');
	});

	test('skips students the visibility filter rejects', () => {
		const rows = buildReturnMeasureRows(
			[measure(1, 7, '2026-09-09'), measure(2, 8, '2026-09-09')],
			(studentId) => studentId === 8,
		);

		expect(rows.map((row) => row.studentId)).toEqual([8]);
	});
});

describe('returnMeasurePeriodRange', () => {
	test('covers today, the surrounding week, and the whole month', () => {
		expect(returnMeasurePeriodRange('today', now)).toEqual({ startKey: '2026-09-09', endKey: '2026-09-09' });
		expect(returnMeasurePeriodRange('week', now)).toEqual({ startKey: '2026-09-07', endKey: '2026-09-13' });
		expect(returnMeasurePeriodRange('month', now)).toEqual({ startKey: '2026-09-01', endKey: '2026-09-30' });
	});
});

describe('filterReturnMeasureRows', () => {
	const rows = buildReturnMeasureRows(
		[
			measure(1, 7, '2026-09-09'), // today, open
			measure(2, 8, '2026-09-11'), // later this week, open
			measure(3, 9, '2026-09-25'), // later this month, open
			handled(4, 10, '2026-09-09'), // today, handled
			measure(5, 11, null), // unplanned
		],
		alwaysVisible,
	);

	test('defaults to a single day and widens with the period', () => {
		expect(ids(filterReturnMeasureRows(rows, 'today', 'all', now))).toEqual([1, 4, 5]);
		expect(ids(filterReturnMeasureRows(rows, 'week', 'all', now))).toEqual([1, 2, 4, 5]);
		expect(ids(filterReturnMeasureRows(rows, 'month', 'all', now))).toEqual([1, 2, 3, 4, 5]);
	});

	test('keeps unplanned measures visible in every period, since they carry no date', () => {
		expect(ids(filterReturnMeasureRows(rows, 'today', 'unplanned', now))).toEqual([5]);
		expect(ids(filterReturnMeasureRows(rows, 'month', 'unplanned', now))).toEqual([5]);
	});

	test('narrows on handling state within the period', () => {
		expect(ids(filterReturnMeasureRows(rows, 'today', 'open', now))).toEqual([1]);
		expect(ids(filterReturnMeasureRows(rows, 'week', 'open', now))).toEqual([1, 2]);
		expect(ids(filterReturnMeasureRows(rows, 'today', 'handled', now))).toEqual([4]);
	});

	test('counts every status for the active period', () => {
		expect(countReturnMeasureRowsByStatus(rows, 'today', now)).toEqual({
			open: 1,
			handled: 1,
			unplanned: 1,
			all: 3,
		});
	});
});

describe('countOpenReturnMeasuresToday', () => {
	const measures = [
		measure(1, 7, '2026-09-09'), // today, open
		measure(2, 8, '2026-09-09'), // today, open, other student
		measure(3, 9, '2026-09-11'), // later this week, open
		handled(4, 10, '2026-09-09'), // today, handled
		measure(5, 11, null), // unplanned
	];

	test('counts only today and only what still needs handling', () => {
		expect(countOpenReturnMeasuresToday(measures, alwaysVisible, now)).toBe(2);
	});

	test('respects the student filter', () => {
		expect(countOpenReturnMeasuresToday(measures, (studentId) => studentId === 7, now)).toBe(1);
	});
});

describe('groupReturnMeasureRowsByDay', () => {
	test('orders days chronologically and puts unscheduled measures last', () => {
		const rows = buildReturnMeasureRows(
			[measure(1, 7, '2026-09-11'), measure(2, 8, null), measure(3, 9, '2026-09-09')],
			alwaysVisible,
		);

		expect(groupReturnMeasureRowsByDay(rows).map((group) => group.dateKey)).toEqual([
			'2026-09-09',
			'2026-09-11',
			null,
		]);
	});

	test('sorts a day by start time, then by student name', () => {
		const early = measure(1, 7, '2026-09-09', {
			begin: toISOFromDateKeyAndTime('2026-09-09', '08:00'),
			einde: toISOFromDateKeyAndTime('2026-09-09', '16:00'),
		});
		const late = measure(2, 8, '2026-09-09');
		const groups = groupReturnMeasureRowsByDay(buildReturnMeasureRows([late, early], alwaysVisible));

		expect(groups[0].rows.map((row) => row.id)).toEqual([1, 2]);
	});
});

function ids(rows: { id: number }[]): number[] {
	return rows.map((row) => row.id).sort((a, b) => a - b);
}
