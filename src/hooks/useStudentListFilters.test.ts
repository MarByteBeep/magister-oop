import { expect, test } from 'bun:test';
import type { Student } from '@/magister/types';
import { studentMatchesSearch } from './useStudentListFilters';

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

test('matches first name only', () => {
	expect(studentMatchesSearch(createStudent(), 'Jan')).toBe(true);
});

test('matches multiple name parts even with tussenvoegsel in between', () => {
	expect(studentMatchesSearch(createStudent(), 'Jan Vries')).toBe(true);
	expect(studentMatchesSearch(createStudent(), 'de Vries')).toBe(true);
});

test('requires every search word to match somewhere', () => {
	expect(studentMatchesSearch(createStudent(), 'Jan 4A')).toBe(true);
	expect(studentMatchesSearch(createStudent(), 'Jan 5B')).toBe(false);
});

test('matches locker search prefix', () => {
	expect(studentMatchesSearch(createStudent({ lockerCode: '42' }), 'k:42')).toBe(true);
});
