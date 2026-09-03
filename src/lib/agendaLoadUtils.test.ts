import { describe, expect, test } from 'bun:test';
import type { Student } from '@/magister/types';
import { needsAgendaDayFetch } from './agendaLoadUtils';

function createStudent(overrides: Partial<Student> = {}): Student {
	return {
		id: 1,
		voorletters: 'J.',
		roepnaam: 'Jan',
		tussenvoegsel: 'de',
		achternaam: 'Vries',
		code: '12345',
		klassen: ['Dummy VP'],
		studies: ['HAVO'],
		emailadres: 'jan@school.nl',
		telefoonnummer: '0612345678',
		lesgroepen: [],
		externeId: 'ext-1',
		links: { self: { href: '/students/1' } },
		...overrides,
	};
}

const todayKey = '2026-09-03';

describe('needsAgendaDayFetch', () => {
	test('returns false when agenda and loaded-for flags are present', () => {
		const student = createStudent({
			agenda: { [todayKey]: [] },
			returnMeasuresLoadedFor: { [todayKey]: true },
			absenceNoticesLoadedFor: { [todayKey]: true },
		});

		expect(needsAgendaDayFetch(student, todayKey)).toBe(false);
	});

	test('returns true when measure or notice flags are missing', () => {
		const student = createStudent({
			agenda: { [todayKey]: [] },
		});

		expect(needsAgendaDayFetch(student, todayKey)).toBe(true);
	});
});
