import { expect, test } from 'bun:test';
import { lessonEntry } from '@/lib/agendaEntryUtils';
import { toISOFromDateKeyAndTime } from '@/lib/dateUtils';
import { studentDataStore } from '@/lib/studentDataStore';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { StudentWrite } from '@/types/studentStore.types';

function staffMember(id: number, lastName: string) {
	return {
		id,
		type: 'medewerker' as const,
		code: 'DOC',
		voorletters: 'AB',
		roepnaam: 'Doc',
		tussenvoegsel: null,
		achternaam: lastName,
		links: { self: { href: `/api/medewerkers/${id}` } },
	};
}

function lesson(id: number, teacherId: number, teacherName: string) {
	return lessonEntry({
		id,
		heeftInhoud: false,
		heeftAantekening: false,
		onderwijstijd: 0,
		subtype: 'nvt',
		heeftBijlagen: false,
		herhaalStatus: 'geen',
		begin: toISOFromDateKeyAndTime('2026-09-09', '08:30'),
		einde: toISOFromDateKeyAndTime('2026-09-09', '09:30'),
		onderwerp: 'Wiskunde',
		type: 'les',
		deelnames: [staffMember(teacherId, teacherName)],
		vakken: [],
		locaties: [],
		links: {},
	});
}

function studentWrite(id: number, agenda?: Record<string, AgendaEntry[]>): StudentWrite {
	return {
		id,
		code: String(id),
		roepnaam: 'Test',
		achternaam: 'Leerling',
		voorletters: 'TL',
		tussenvoegsel: '',
		lesgroepen: [],
		emailadres: 'test@example.com',
		externeId: `00000000-0000-0000-0000-${String(id).padStart(12, '0')}`,
		klassen: ['1A1'],
		studies: ['1A'],
		telefoonnummer: '',
		links: { self: { href: `/api/leerlingen/${id}` } },
		agenda,
	};
}

test('shares agenda items and staff members across students', () => {
	studentDataStore.clear();

	const sharedLesson = lesson(100, 5, 'Jansen');
	studentDataStore.setStudents([
		studentWrite(1, { '2026-09-09': [sharedLesson] }),
		studentWrite(2, { '2026-09-09': [sharedLesson] }),
	]);

	const [first, second] = studentDataStore.getStudents();
	const firstAgenda = first.agenda?.['2026-09-09']?.[0];
	const secondAgenda = second.agenda?.['2026-09-09']?.[0];
	expect(firstAgenda).toEqual(secondAgenda);
	expect(firstAgenda?.kind).toBe('lesson');
	if (firstAgenda?.kind === 'lesson') {
		expect(firstAgenda.item.id).toBe(100);
		expect(firstAgenda.item.deelnames[0]).toMatchObject({
			type: 'medewerker',
			id: 5,
			achternaam: 'Jansen',
		});
	}
});

test('clear removes all students', () => {
	studentDataStore.clear();
	studentDataStore.setStudents([studentWrite(1)]);
	expect(studentDataStore.getStudents()).toHaveLength(1);

	studentDataStore.clear();
	expect(studentDataStore.getStudents()).toHaveLength(0);
});

test('keeps stable student references when another student is updated', () => {
	studentDataStore.clear();

	const lessonForOne = lesson(100, 5, 'Jansen');
	const lessonForTwo = lesson(101, 6, 'Pietersen');
	studentDataStore.setStudents([
		studentWrite(1, { '2026-09-09': [lessonForOne] }),
		studentWrite(2, { '2026-09-09': [lessonForTwo] }),
	]);

	const [firstBefore, secondBefore] = studentDataStore.getStudents();
	const agendaEntryBefore = firstBefore.agenda?.['2026-09-09']?.[0];

	studentDataStore.setStudents([
		studentWrite(1, { '2026-09-09': [lessonForOne] }),
		studentWrite(2, {
			'2026-09-09': [lessonForTwo],
			'2026-09-10': [],
		}),
	]);

	const [firstAfter, secondAfter] = studentDataStore.getStudents();
	expect(firstAfter).toBe(firstBefore);
	expect(firstAfter.agenda?.['2026-09-09']?.[0]).toBe(agendaEntryBefore);
	expect(secondAfter).not.toBe(secondBefore);
});

test('subscribeStudent only notifies listeners for the changed student', () => {
	studentDataStore.clear();

	const lessonForOne = lesson(100, 5, 'Jansen');
	const lessonForTwo = lesson(101, 6, 'Pietersen');
	studentDataStore.setStudents([
		studentWrite(1, { '2026-09-09': [lessonForOne] }),
		studentWrite(2, { '2026-09-09': [lessonForTwo] }),
	]);

	let firstListenerCalls = 0;
	let secondListenerCalls = 0;
	const unsubscribeFirst = studentDataStore.subscribeStudent(1, () => {
		firstListenerCalls += 1;
	});
	const unsubscribeSecond = studentDataStore.subscribeStudent(2, () => {
		secondListenerCalls += 1;
	});

	studentDataStore.setStudents([
		studentWrite(1, { '2026-09-09': [lessonForOne] }),
		studentWrite(2, {
			'2026-09-09': [lessonForTwo],
			'2026-09-10': [],
		}),
	]);

	expect(firstListenerCalls).toBe(0);
	expect(secondListenerCalls).toBe(1);

	unsubscribeFirst();
	unsubscribeSecond();
});

test('snapshot roundtrip preserves normalized data', () => {
	studentDataStore.clear();

	const sharedLesson = lesson(200, 9, 'Bakker');
	studentDataStore.setStudents([
		studentWrite(1, { '2026-09-09': [sharedLesson] }),
		studentWrite(2, { '2026-09-09': [sharedLesson] }),
	]);

	const snapshot = studentDataStore.exportSnapshot();
	studentDataStore.clear();
	expect(studentDataStore.getStudents()).toHaveLength(0);

	studentDataStore.importSnapshot(snapshot);
	expect(studentDataStore.getStudents()).toHaveLength(2);
	expect(studentDataStore.exportSnapshot().agendaItems).toHaveLength(1);
	expect(studentDataStore.exportSnapshot().staffMembers).toHaveLength(1);
});

test('drops agenda entries with missing interned items instead of throwing', () => {
	studentDataStore.clear();

	const sharedLesson = lesson(300, 10, 'Smit');
	studentDataStore.setStudents([studentWrite(1, { '2026-09-09': [sharedLesson] })]);

	const snapshot = studentDataStore.exportSnapshot();
	snapshot.agendaItems = [];
	studentDataStore.importSnapshot(snapshot);

	expect(studentDataStore.getStudents()[0]?.agenda?.['2026-09-09']).toEqual([]);
});

test('exportSnapshot prunes unreferenced interned entities', () => {
	studentDataStore.clear();

	const sharedLesson = lesson(400, 11, 'Vos');
	studentDataStore.setStudents([studentWrite(1, { '2026-09-09': [sharedLesson] })]);

	studentDataStore.setStudents([studentWrite(1, { '2026-09-10': [] })]);

	const snapshot = studentDataStore.exportSnapshot();
	expect(snapshot.agendaItems).toHaveLength(0);
	expect(snapshot.staffMembers).toHaveLength(0);
});
