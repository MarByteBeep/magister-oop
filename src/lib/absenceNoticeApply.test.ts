import { describe, expect, test } from 'bun:test';
import type { AbsenceNotice } from '@/magister/response/absence-notice.types';
import type { Student } from '@/magister/types';
import { applyAbsenceNoticesToStudents } from './absenceNoticeApply';
import { absenceNoticeEntries, isAbsenceNoticeEntry, lessonEntry } from './agendaEntryUtils';
import { parseDateKey, toISOFromDateKeyAndTime } from './dateUtils';

const dateKey = '2026-09-02';
const externalId = '88fb9576-7670-4661-aed2-75a547cf319f';

function notice(partial: Partial<AbsenceNotice> = {}): AbsenceNotice {
	return {
		absenceNoticeId: 'af0cf7e7-b522-4ba9-9f65-6de88bd259d0',
		attendanceTypeCode: 'D',
		attendanceTypeDescription: 'Dokter, Huisarts',
		startDateTime: toISOFromDateKeyAndTime(dateKey, '09:20'),
		endDateTime: toISOFromDateKeyAndTime(dateKey, '10:00'),
		expectedEndDateTime: null,
		createdDateTime: '2026-09-01T12:00:00.000Z',
		consecutiveDays: 1,
		student: {
			id: externalId,
			firstName: 'Ada',
			lastName: 'Boyer',
			infix: '',
			groups: ['3B1'],
			studies: ['3B'],
			zenId: 86488,
			studentNumber: 16159,
			hasPhoto: true,
		},
		unit: { id: 'af5e4311-d487-48e1-8b0f-519423e1e0ee', name: 'VP' },
		comment: '',
		internalComment: '',
		creator: {
			accountId: '11111111-1111-4111-8111-111111111111',
			role: 'Parent',
			initials: 'AM',
			lastName: 'Boyer',
			infix: '',
		},
		modifiedBy: null,
		lastModified: null,
		signals: [],
		attachment: null,
		links: [],
		isRecurring: false,
		...partial,
	};
}

function student(overrides: Partial<Student> = {}): Student {
	return {
		id: 1,
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
		externeId: externalId,
		links: { self: { href: '/students/1' } },
		...overrides,
	};
}

function lessonForDay() {
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

describe('applyAbsenceNoticesToStudents', () => {
	test('replaces overlays for students that already have an agenda day', () => {
		const oldNotice = notice();
		const day = parseDateKey(dateKey);
		const current = student({
			agenda: {
				[dateKey]: [lessonForDay(), ...absenceNoticeEntries(oldNotice, day, day)],
			},
		});
		const fresh = notice({
			absenceNoticeId: 'fresh',
			attendanceTypeCode: 'ZK',
			attendanceTypeDescription: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime(dateKey, '08:30'),
			endDateTime: toISOFromDateKeyAndTime(dateKey, '16:00'),
		});

		const next = applyAbsenceNoticesToStudents([current], [fresh], dateKey);
		const overlays = next[0].agenda?.[dateKey]?.filter(isAbsenceNoticeEntry) ?? [];
		expect(overlays).toHaveLength(1);
		expect(overlays[0].notice.absenceNoticeId).toBe('fresh');
		expect(next[0].agenda?.[dateKey]?.some((entry) => entry.kind === 'lesson')).toBe(true);
	});

	test('leaves students without that agenda day untouched', () => {
		const current = student({ agenda: {} });
		const students = [current];
		expect(applyAbsenceNoticesToStudents(students, [notice()], dateKey)).toBe(students);
	});
});
