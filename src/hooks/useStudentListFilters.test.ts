import { expect, test } from 'bun:test';
import { lessonEntry } from '@/lib/agendaEntryUtils';
import { getDateKey } from '@/lib/dateUtils';
import type { Student } from '@/types/student.types';
import { studentMatchesSearch } from './useStudentListFilters';

const lessonStart = '2026-09-23T08:00:00.000Z';
const lessonEnd = '2026-09-23T09:00:00.000Z';
const currentTime = new Date('2026-09-23T08:30:00.000Z');
const dateKey = getDateKey(currentTime);

function createStudent(overrides: Partial<Student> = {}): Student {
	return {
		id: 1,
		voorletters: 'J.',
		roepnaam: 'Jan',
		tussenvoegsel: 'de',
		achternaam: 'Vries',
		code: '12345',
		klassen: ['4A'],
		studies: ['HAVO'],
		emailadres: 'jan@school.nl',
		telefoonnummer: '0612345678',
		lesgroepen: [],
		externeId: 'ext-1',
		links: { self: { href: '/students/1' } },
		...overrides,
	};
}

function createCurrentLessonEntry() {
	return lessonEntry({
		id: 1,
		heeftInhoud: false,
		heeftAantekening: false,
		onderwijstijd: 0,
		subtype: 'nvt',
		heeftBijlagen: false,
		herhaalStatus: 'geen',
		begin: lessonStart,
		einde: lessonEnd,
		onderwerp: 'Wiskunde',
		type: 'les',
		vakken: [{ id: 1, code: 'WI', omschrijving: 'Wiskunde', links: {} }],
		locaties: [{ code: 'A101', omschrijving: 'Lokaal A101', type: 'lokaal', links: {} }],
		deelnames: [
			{
				id: 1,
				type: 'medewerker',
				code: 'JANS',
				voorletters: 'J.',
				roepnaam: 'Jan',
				tussenvoegsel: null,
				achternaam: 'Janssen',
			},
		],
		links: {},
	});
}

test('matches first name only', () => {
	expect(studentMatchesSearch(createStudent(), 'Jan', currentTime)).toBe(true);
});

test('matches multiple name parts even with tussenvoegsel in between', () => {
	expect(studentMatchesSearch(createStudent(), 'Jan Vries', currentTime)).toBe(true);
	expect(studentMatchesSearch(createStudent(), 'de Vries', currentTime)).toBe(true);
});

test('requires every search word to match somewhere', () => {
	expect(studentMatchesSearch(createStudent(), 'Jan 4A', currentTime)).toBe(true);
	expect(studentMatchesSearch(createStudent(), 'Jan 5B', currentTime)).toBe(false);
});

test('matches locker search prefix', () => {
	expect(studentMatchesSearch(createStudent({ lockerCode: '42' }), 'k:42', currentTime)).toBe(true);
});

test('matches current lesson subject, location, and teacher from agenda', () => {
	const student = createStudent({
		agenda: { [dateKey]: [createCurrentLessonEntry()] },
	});

	expect(studentMatchesSearch(student, 'WI', currentTime)).toBe(true);
	expect(studentMatchesSearch(student, 'A101', currentTime)).toBe(true);
	expect(studentMatchesSearch(student, 'JANS', currentTime)).toBe(true);
	expect(studentMatchesSearch(student, 'Jan WI', currentTime)).toBe(true);
});

test('does not match lesson fields outside the current time slot', () => {
	const student = createStudent({
		agenda: { [dateKey]: [createCurrentLessonEntry()] },
	});
	const afterLesson = new Date('2026-09-23T09:30:00.000Z');

	expect(studentMatchesSearch(student, 'WI', afterLesson)).toBe(false);
	expect(studentMatchesSearch(student, 'A101', afterLesson)).toBe(false);
	expect(studentMatchesSearch(student, 'JANS', afterLesson)).toBe(false);
});
