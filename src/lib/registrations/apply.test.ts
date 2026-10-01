import { describe, expect, test } from 'bun:test';
import { isLessonEntry, isRegistrationEntry, lessonEntry } from '@/lib/agenda/entryUtils';
import { applyRegistrationsToStudents } from '@/lib/registrations/apply';
import { toISOFromDateKeyAndTime } from '@/lib/shared/dateUtils';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';
import type { Student } from '@/types/student.types';

const dateKey = '2026-09-02';

function response(studentId: number): RegistrationsResponse {
	return {
		filters: { types: [] },
		items: [
			{
				id: studentId,
				voorletters: 'A.',
				roepnaam: 'Ada',
				tussenvoegsel: null,
				achternaam: 'Boyer',
				stamklas: { id: 1, code: '3B1' },
				stamnummer: '16159',
				afwezigheidsredenen: null,
				afspraken: [
					{
						id: 10,
						begin: toISOFromDateKeyAndTime(dateKey, '10:50'),
						einde: toISOFromDateKeyAndTime(dateKey, '11:30'),
						lesuurBegin: 4,
						lesuurEinde: 4,
						omschrijving: 'Nederlands',
						organisatorPersoonIds: [],
						isVerantwoord: false,
						verantwoordingen: [
							{
								id: 3,
								reden: {
									id: 1,
									code: 'A',
									type: 'Absent',
									isGeoorloofd: false,
									omschrijving: 'Absent',
								},
								opmerking: null,
								links: { self: { href: '/api/medewerkers/afspraken/verantwoordingen/3' } },
							},
						],
						links: {
							verantwoordingen: { href: '/v' },
							verantwoordingenDeelnemer: { href: '/vd' },
						},
					},
				],
				links: { foto: { href: '/foto' } },
			},
		],
		links: { first: { href: '/first' }, last: { href: '/last' } },
		totalCount: 1,
	};
}

function student(agenda: Student['agenda']): Student {
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
		externeId: 'ext',
		links: { self: { href: '/students/7' } },
		agenda,
	};
}

function lesson() {
	return lessonEntry({
		id: 1,
		heeftInhoud: false,
		heeftAantekening: false,
		onderwijstijd: 0,
		subtype: 'nvt',
		heeftBijlagen: false,
		herhaalStatus: 'geen',
		begin: toISOFromDateKeyAndTime(dateKey, '10:50'),
		einde: toISOFromDateKeyAndTime(dateKey, '11:30'),
		onderwerp: 'Nederlands',
		type: 'les',
		deelnames: [],
		vakken: [],
		locaties: [],
		links: {},
	});
}

describe('applyRegistrationsToStudents', () => {
	test('adds registration overlays on a loaded agenda day', () => {
		const next = applyRegistrationsToStudents([student({ [dateKey]: [lesson()] })], response(7), dateKey);
		const day = next[0].agenda?.[dateKey] ?? [];
		expect(day.filter(isLessonEntry)).toHaveLength(1);
		expect(day.filter(isRegistrationEntry).map((entry) => entry.registration.code)).toEqual(['A']);
	});

	test('clears overlays when the student has no registrations that day', () => {
		const withOverlay = applyRegistrationsToStudents([student({ [dateKey]: [lesson()] })], response(7), dateKey);
		const cleared = applyRegistrationsToStudents(withOverlay, response(8), dateKey);
		expect(cleared[0].agenda?.[dateKey]?.filter(isRegistrationEntry)).toEqual([]);
	});

	test('leaves students without that agenda day untouched', () => {
		const students = [student(undefined)];
		expect(applyRegistrationsToStudents(students, response(7), dateKey)).toBe(students);
	});
});
