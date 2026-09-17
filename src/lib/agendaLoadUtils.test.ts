import { describe, expect, test } from 'bun:test';
import type { Student } from '@/magister/types';
import { needsAgendaDayFetch, needsAgendaRangeFetch } from './agendaLoadUtils';
import { parseDateKey } from './dateUtils';

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
			absenceNoticesLoadedFor: { [todayKey]: true },
		});

		expect(needsAgendaDayFetch(student, todayKey)).toBe(false);
	});

	test('returns true when the notice flag is missing', () => {
		const student = createStudent({
			agenda: { [todayKey]: [] },
		});

		expect(needsAgendaDayFetch(student, todayKey)).toBe(true);
	});
});

describe('needsAgendaRangeFetch', () => {
	const monday = parseDateKey('2026-09-01');
	const friday = parseDateKey('2026-09-05');
	const weekKeys = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'];

	test('returns false when every weekday is loaded', () => {
		const student = createStudent({
			agenda: Object.fromEntries(weekKeys.map((key) => [key, []])),
			absenceNoticesLoadedFor: Object.fromEntries(weekKeys.map((key) => [key, true])),
		});

		expect(needsAgendaRangeFetch(student, monday, friday)).toBe(false);
	});

	test('returns true when one weekday is missing', () => {
		const student = createStudent({
			agenda: {
				'2026-09-01': [],
				'2026-09-02': [],
				'2026-09-03': [],
				'2026-09-04': [],
			},
			absenceNoticesLoadedFor: Object.fromEntries(weekKeys.map((key) => [key, true])),
		});

		expect(needsAgendaRangeFetch(student, monday, friday)).toBe(true);
	});
});
