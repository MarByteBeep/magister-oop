import { expect, test } from 'bun:test';
import type { Student } from '@/types/student.types';
import { isLessonEntry, isReturnMeasureEntry, lessonEntry, returnMeasureEntry } from './agendaEntryUtils';
import { toISOFromDateKeyAndTime } from './dateUtils';
import { applyReturnMeasuresToStudents } from './returnMeasureApply';
import { returnMeasureStudentDetails, scheduledReturnMeasure } from './returnMeasureFixtures';

const dateKey = '2026-09-09';
const otherMonthKey = '2026-10-01';

function measure(id: number, studentId: number, day: string) {
	return scheduledReturnMeasure(toISOFromDateKeyAndTime(day, '08:30'), toISOFromDateKeyAndTime(day, '09:30'), {
		id,
		leerling: returnMeasureStudentDetails(studentId),
	});
}

function lesson(day: string) {
	return lessonEntry({
		id: 1,
		heeftInhoud: false,
		heeftAantekening: false,
		onderwijstijd: 0,
		subtype: 'nvt',
		heeftBijlagen: false,
		herhaalStatus: 'geen',
		begin: toISOFromDateKeyAndTime(day, '10:50'),
		einde: toISOFromDateKeyAndTime(day, '11:30'),
		onderwerp: 'Nederlands',
		type: 'les',
		deelnames: [],
		vakken: [],
		locaties: [],
		links: {},
	});
}

function student(overrides: Partial<Student> = {}): Student {
	return {
		id: 7,
		voorletters: 'A.',
		roepnaam: 'Ada',
		tussenvoegsel: '',
		achternaam: 'Boyer',
		code: '16159',
		klassen: ['3B1'],
		studies: ['3B'],
		emailadres: 'ada@school.nl',
		telefoonnummer: '0612345678',
		lesgroepen: [],
		externeId: 'ext-7',
		links: { self: { href: '/students/7' } },
		...overrides,
	};
}

test('replaces return measure overlays on loaded days and keeps lessons', () => {
	const stale = returnMeasureEntry(measure(1, 7, dateKey));
	const students = [student({ agenda: { [dateKey]: [lesson(dateKey), stale] } })];

	const [updated] = applyReturnMeasuresToStudents(students, [measure(2, 7, dateKey)], dateKey);

	const day = updated.agenda?.[dateKey] ?? [];
	expect(day.filter(isLessonEntry)).toHaveLength(1);
	expect(day.filter(isReturnMeasureEntry).map((entry) => entry.measure.id)).toEqual([2]);
});

test('drops overlays that disappeared from the bulk list', () => {
	const students = [student({ agenda: { [dateKey]: [returnMeasureEntry(measure(1, 7, dateKey))] } })];

	const [updated] = applyReturnMeasuresToStudents(students, [], dateKey);

	expect(updated.agenda?.[dateKey]).toEqual([]);
});

test('leaves days outside the fetched month untouched', () => {
	const otherMonth = [returnMeasureEntry(measure(1, 7, otherMonthKey))];
	const students = [student({ agenda: { [otherMonthKey]: otherMonth } })];

	const result = applyReturnMeasuresToStudents(students, [], dateKey);

	expect(result[0]).toBe(students[0]);
	expect(result[0].agenda?.[otherMonthKey]).toEqual(otherMonth);
});

test('ignores measures of other students and days that were never loaded', () => {
	const students = [student({ agenda: {} }), student({ id: 8, externeId: 'ext-8' })];

	const result = applyReturnMeasuresToStudents(students, [measure(3, 8, dateKey)], dateKey);

	expect(result).toBe(students);
});
