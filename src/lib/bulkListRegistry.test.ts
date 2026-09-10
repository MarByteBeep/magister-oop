import { describe, expect, test } from 'bun:test';
import type { AbsenceNotice } from '@/magister/response/absence-notice.types';
import type { Student } from '@/magister/types';
import { applyAbsenceNoticesToStudents } from './absenceNoticeApply';
import { absenceNoticeEntries, isAbsenceNoticeEntry, lessonEntry } from './agendaEntryUtils';
import { createBulkListRegistry, defineBulkList } from './bulkListRegistry';
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

function studentWithAgenda(oldNotice: AbsenceNotice): Student {
	const day = parseDateKey(dateKey);
	return student({
		agenda: {
			[dateKey]: [
				lessonEntry({
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
				}),
				...absenceNoticeEntries(oldNotice, day, day),
			],
		},
	});
}

describe('createBulkListRegistry', () => {
	test('applies a successful refresh to attached students', async () => {
		const fresh = notice({
			absenceNoticeId: 'fresh',
			attendanceTypeCode: 'ZK',
			attendanceTypeDescription: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime(dateKey, '08:30'),
			endDateTime: toISOFromDateKeyAndTime(dateKey, '16:00'),
		});
		let students = [studentWithAgenda(notice())];
		const registry = createBulkListRegistry([
			defineBulkList({
				id: 'absence-notices',
				fetch: async () => [fresh],
				applyToStudents: applyAbsenceNoticesToStudents,
			}),
		]);
		registry.attachStudentUpdater((update) => {
			students = typeof update === 'function' ? update(students) : update;
		});

		await registry.refresh('absence-notices', dateKey, 'background');
		const overlays = students[0].agenda?.[dateKey]?.filter(isAbsenceNoticeEntry) ?? [];
		expect(overlays[0]?.notice.absenceNoticeId).toBe('fresh');
		expect(registry.snapshot('absence-notices')?.data).toEqual([fresh]);
	});

	test('keeps agenda overlays when a refresh returns nothing', async () => {
		const current = studentWithAgenda(notice());
		let students = [current];
		const registry = createBulkListRegistry([
			defineBulkList({
				id: 'absence-notices',
				fetch: async () => null,
				applyToStudents: applyAbsenceNoticesToStudents,
			}),
		]);
		registry.attachStudentUpdater((update) => {
			students = typeof update === 'function' ? update(students) : update;
		});

		await registry.refresh('absence-notices', dateKey, 'background');
		expect(students[0].agenda?.[dateKey]?.find(isAbsenceNoticeEntry)?.notice.absenceNoticeId).toBe(
			'af0cf7e7-b522-4ba9-9f65-6de88bd259d0',
		);
	});

	test('dedupes concurrent refreshes for the same list and date across modes', async () => {
		let fetches = 0;
		const registry = createBulkListRegistry([
			defineBulkList({
				id: 'counts',
				fetch: async () => {
					fetches += 1;
					await Promise.resolve();
					return { count: fetches };
				},
			}),
		]);

		const [first, second] = await Promise.all([
			registry.refresh('counts', dateKey, 'initial'),
			registry.refresh('counts', dateKey, 'background'),
		]);
		expect(fetches).toBe(1);
		expect(first).toEqual(second);
	});

	test('promotes a background inflight to initial error semantics on retry', async () => {
		let release!: () => void;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const registry = createBulkListRegistry([
			defineBulkList({
				id: 'counts',
				fetch: async () => {
					await gate;
					return null;
				},
			}),
		]);

		const background = registry.refresh('counts', dateKey, 'background');
		expect(registry.snapshot('counts')?.refreshing).toBe(true);

		const initial = registry.refresh('counts', dateKey, 'initial');
		expect(registry.snapshot('counts')?.loading).toBe(true);
		expect(registry.snapshot('counts')?.refreshing).toBe(false);
		expect(registry.snapshot('counts')?.error).toBe(null);

		release();
		await Promise.all([background, initial]);
		expect(registry.snapshot('counts')?.error).toBe('Kon de lijst niet ophalen.');
		expect(registry.snapshot('counts')?.loading).toBe(false);
	});

	test('returns null from snapshot when publishSnapshot is false', async () => {
		const fresh = notice({
			absenceNoticeId: 'fresh',
			attendanceTypeCode: 'ZK',
			attendanceTypeDescription: 'Ziek gemeld',
			startDateTime: toISOFromDateKeyAndTime(dateKey, '08:30'),
			endDateTime: toISOFromDateKeyAndTime(dateKey, '16:00'),
		});
		let students = [studentWithAgenda(notice())];
		const registry = createBulkListRegistry([
			defineBulkList({
				id: 'absence-notices',
				fetch: async () => [fresh],
				applyToStudents: applyAbsenceNoticesToStudents,
				publishSnapshot: false,
			}),
		]);
		registry.attachStudentUpdater((update) => {
			students = typeof update === 'function' ? update(students) : update;
		});

		await registry.refresh('absence-notices', dateKey, 'background');
		expect(students[0].agenda?.[dateKey]?.find(isAbsenceNoticeEntry)?.notice.absenceNoticeId).toBe('fresh');
		expect(registry.snapshot('absence-notices')).toBe(null);
		expect(registry.snapshot('typo-id')).toBe(null);
		expect(() => registry.subscribe('absence-notices', () => {})).toThrow(/does not publish a snapshot/);
	});
});
