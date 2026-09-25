import { describe, expect, test } from 'bun:test';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';
import type { Student } from '@/types/student.types';
import { buildFilterPairs, buildRegistrationRows, countAbsentRegistrations } from './registrationsUtils';
import { createStudentVisibility } from './studentVisibility';

function registrationResponse(itemId: number): RegistrationsResponse {
	return {
		filters: { types: [{ count: 1, name: 'Absent', id: 1 }] },
		items: [
			{
				id: itemId,
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
						begin: '2026-09-09T07:30:00.000Z',
						einde: '2026-09-09T08:10:00.000Z',
						lesuurBegin: 1,
						lesuurEinde: 1,
						omschrijving: 'Wiskunde',
						organisatorPersoonIds: [],
						isVerantwoord: false,
						verantwoordingen: [
							{
								id: 99,
								reden: {
									id: 1,
									code: 'A',
									type: 'Absent',
									isGeoorloofd: false,
									omschrijving: 'Absent',
								},
								opmerking: null,
								links: { self: { href: '/x' } },
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

function student(id: number): Student {
	return {
		id,
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
		links: { self: { href: '/students/1' } },
	};
}

function rowsFor(data: ReturnType<typeof registrationResponse>, studentById: Map<number, Student>, studies: string[]) {
	const isVisible = createStudentVisibility(studentById, new Set(studies));
	return buildRegistrationRows(data, isVisible, buildFilterPairs(data));
}

describe('buildRegistrationRows', () => {
	test('shows API items without a loaded student while no study is selected', () => {
		const data = registrationResponse(42);
		const byReason = rowsFor(data, new Map(), []);
		expect(byReason.get('absent')?.length).toBe(1);
		expect(byReason.get('absent')?.[0]?.studentName).toBe('Ada Boyer');
	});

	test('hides students that are not loaded yet once a study is selected', () => {
		const data = registrationResponse(42);
		expect(rowsFor(data, new Map(), ['3B']).size).toBe(0);
	});

	test('keeps loaded students that match the selected study', () => {
		const data = registrationResponse(1);
		const byReason = rowsFor(data, new Map([[1, student(1)]]), ['3B']);
		expect(byReason.get('absent')?.length).toBe(1);
	});

	test('hides loaded students outside the selected study', () => {
		const data = registrationResponse(1);
		expect(rowsFor(data, new Map([[1, student(1)]]), ['5A']).size).toBe(0);
	});
});

describe('countAbsentRegistrations', () => {
	test('matches the list: counts unfiltered rows without loaded students', () => {
		const data = registrationResponse(42);
		expect(countAbsentRegistrations(data, createStudentVisibility(new Map(), new Set()))).toBe(1);
	});

	test('matches the list: skips unloaded students once a study is selected', () => {
		const data = registrationResponse(42);
		expect(countAbsentRegistrations(data, createStudentVisibility(new Map(), new Set(['3B'])))).toBe(0);
	});

	test('counts a loaded student that matches the selected study', () => {
		const data = registrationResponse(1);
		const isVisible = createStudentVisibility(new Map([[1, student(1)]]), new Set(['3B']));
		expect(countAbsentRegistrations(data, isVisible)).toBe(1);
	});
});
