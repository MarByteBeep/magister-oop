import { describe, expect, test } from 'bun:test';
import { agendaEntriesToCalendarEvents } from '@/lib/agenda/calendarUtils';
import { lessonEntry } from '@/lib/agenda/entryUtils';
import {
	registrationAbbreviation,
	registrationDeleteId,
	registrationEntriesForStudent,
	registrationLabel,
	registrationLessonHourLabel,
	registrationMatchesLesson,
	registrationTone,
} from '@/lib/registrations/entries';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { RegistrationAgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Justification, RegistrationsResponse } from '@/magister/response/registrations.types';

function justification(partial: Partial<Justification> = {}): Justification {
	return {
		id: 99,
		reden: {
			id: 1,
			code: 'U',
			type: 'uitgestuurd',
			isGeoorloofd: false,
			omschrijving: 'Uit de les gestuurd',
		},
		opmerking: 'praat door',
		links: { self: { href: '/api/medewerkers/afspraken/verantwoordingen/35555551' } },
		...partial,
	};
}

function response(studentId: number, justifications: Justification[]): RegistrationsResponse {
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
						begin: '2026-09-02T08:50:00.000Z',
						einde: '2026-09-02T09:30:00.000Z',
						lesuurBegin: 3,
						lesuurEinde: 3,
						omschrijving: 'Nederlands',
						organisatorPersoonIds: [],
						isVerantwoord: false,
						verantwoordingen: justifications,
						links: {
							verantwoordingen: { href: '/v' },
							verantwoordingenDeelnemer: { href: '/vd' },
						},
					},
					{
						id: 11,
						begin: '2026-09-02T10:30:00.000Z',
						einde: '2026-09-02T11:10:00.000Z',
						lesuurBegin: 5,
						lesuurEinde: 5,
						omschrijving: 'Wiskunde',
						organisatorPersoonIds: [],
						isVerantwoord: true,
						verantwoordingen: [],
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

describe('registrationEntriesForStudent', () => {
	test('maps a justification onto the appointment and skips empty ones', () => {
		const entries = registrationEntriesForStudent(response(7, [justification()]), 7);
		expect(entries).toHaveLength(1);
		expect(entries[0]).toMatchObject({
			kind: 'registration',
			start: '2026-09-02T08:50:00.000Z',
			end: '2026-09-02T09:30:00.000Z',
			registration: {
				id: 35555551,
				code: 'U',
				description: 'Uit de les gestuurd',
				tone: 'other',
				isAuthorized: false,
				comment: 'praat door',
				appointmentDescription: 'Nederlands',
				lessonHourStart: 3,
				lessonHourEnd: 3,
			},
		});
		expect(registrationLabel(entries[0].registration)).toBe('U');
		expect(registrationLessonHourLabel(entries[0].registration)).toBe('3');
	});

	test('returns nothing for another student', () => {
		expect(registrationEntriesForStudent(response(7, [justification()]), 8)).toEqual([]);
	});
});

describe('registrationAbbreviation', () => {
	test('keeps one or two letters', () => {
		expect(registrationAbbreviation('u')).toBe('U');
		expect(registrationAbbreviation('tl')).toBe('TL');
		expect(registrationAbbreviation('absent')).toBe('AB');
	});

	test('uses the fallback when the code is empty', () => {
		expect(registrationAbbreviation('  ', 'te laat')).toBe('TE');
	});
});

describe('registrationTone', () => {
	test('maps absence, late, and everything else', () => {
		expect(registrationTone('absent')).toBe('absence');
		expect(registrationTone('teLaat')).toBe('late');
		expect(registrationTone('uitgestuurd')).toBe('other');
	});
});

describe('registrationMatchesLesson', () => {
	test('matches the lesson hour on the same day', () => {
		const lesson = lessonEntry(lessonItem('2026-10-01T06:10:00.000Z', '2026-10-01T06:50:00.000Z', 6));
		const registration = registrationEntry('2026-10-01T10:50:00.000Z', '2026-10-01T11:20:00.000Z', 6);
		expect(registrationMatchesLesson(registration, lesson)).toBe(true);
	});

	test('matches a registration on the second hour of a double period', () => {
		const lesson = lessonEntry(lessonItem('2026-10-01T07:10:00.000Z', '2026-10-01T08:30:00.000Z', 2, 3));
		const registration = registrationEntry('2026-10-01T07:50:00.000Z', '2026-10-01T08:30:00.000Z', 3);
		expect(registrationMatchesLesson(registration, lesson)).toBe(true);
	});

	test('skips a different lesson hour', () => {
		const lesson = lessonEntry(lessonItem('2026-10-01T06:10:00.000Z', '2026-10-01T06:50:00.000Z', 6));
		const registration = registrationEntry('2026-10-01T07:30:00.000Z', '2026-10-01T08:10:00.000Z', 7);
		expect(registrationMatchesLesson(registration, lesson)).toBe(false);
	});

	test('falls back to time overlap when hour data is missing', () => {
		const lesson = lessonEntry(lessonItem('2026-10-01T06:10:00.000Z', '2026-10-01T06:50:00.000Z', 6));
		lesson.item.lesuur = undefined;
		const registration = registrationEntry('2026-10-01T06:20:00.000Z', '2026-10-01T06:40:00.000Z', 0);
		expect(registrationMatchesLesson(registration, lesson)).toBe(true);
	});
});

describe('agendaEntriesToCalendarEvents', () => {
	test('draws the registration on the lesson instead of its own event', () => {
		const lesson = lessonEntry(lessonItem('2026-10-01T06:10:00.000Z', '2026-10-01T06:50:00.000Z', 6));
		const registration = registrationEntry('2026-10-01T06:10:00.000Z', '2026-10-01T06:50:00.000Z', 6);
		const events = agendaEntriesToCalendarEvents([lesson, registration]);
		expect(events).toHaveLength(1);
		expect(events[0]?.registrations?.map((entry) => entry.registration.code)).toEqual(['L']);
	});
});

function lessonItem(start: string, end: string, hour: number, hourEnd = hour): AgendaItem {
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
		lesuur: { begin: hour, einde: hourEnd },
		onderwerp: 'Nederlands',
		type: 'les',
		deelnames: [],
		vakken: [],
		locaties: [],
		links: {},
	};
}

function registrationEntry(start: string, end: string, hour: number): RegistrationAgendaEntry {
	return {
		kind: 'registration',
		start,
		end,
		registration: {
			id: hour,
			code: 'L',
			description: 'Te laat',
			tone: 'late',
			isAuthorized: false,
			comment: null,
			appointmentDescription: 'Nederlands',
			lessonHourStart: hour,
			lessonHourEnd: hour,
		},
	};
}

describe('registrationDeleteId', () => {
	test('prefers the id in the self link', () => {
		expect(registrationDeleteId(justification())).toBe(35555551);
	});

	test('falls back to the justification id', () => {
		expect(registrationDeleteId(justification({ links: { self: { href: '/missing' } } }))).toBe(99);
	});
});
