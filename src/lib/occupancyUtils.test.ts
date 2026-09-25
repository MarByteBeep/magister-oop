import { expect, test } from 'bun:test';
import { lessonEntry } from '@/lib/agendaEntryUtils';
import type { AgendaItem, Participant } from '@/magister/response/agenda.types';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/types/student.types';
import { getOccupancyForDay } from './occupancyUtils';

function lessonItem(start: string, end: string, locationCode: string): AgendaItem<Participant> {
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
		onderwerp: 'Nederlands',
		type: 'les',
		deelnames: [],
		vakken: [],
		locaties: [{ code: locationCode, omschrijving: locationCode, type: 'lokaal', links: { self: { href: '' } } }],
		links: {},
	};
}

function studentWithAgenda(dateKey: string, entries: AgendaEntry[]): Student {
	return {
		id: 1,
		voorletters: 'A.',
		roepnaam: 'Ada',
		tussenvoegsel: '',
		achternaam: 'Test',
		code: '1',
		klassen: ['3B1'],
		studies: ['3B'],
		emailadres: 'ada@school.nl',
		telefoonnummer: '',
		lesgroepen: [],
		externeId: '00000000-0000-0000-0000-000000000001',
		links: { self: { href: '/api/leerlingen/1' } },
		agenda: { [dateKey]: entries },
	};
}

test('getOccupancyForDay counts lessons in the last selectable hour without crashing', () => {
	const dateKey = '2026-09-17';
	const occupancy = getOccupancyForDay(
		[studentWithAgenda(dateKey, [lessonEntry(lessonItem(`${dateKey}T15:20:00`, `${dateKey}T16:00:00`, 'A101'))])],
		dateKey,
	);

	expect(occupancy.a101?.['15:20-16:00']).toBe(1);
});
