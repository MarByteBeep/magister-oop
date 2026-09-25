import { describe, expect, test } from 'bun:test';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import { applyFetchResult, MAX_ABSENCE_NOTICE_FETCH_ATTEMPTS } from './absenceNoticeLoadState';
import { lessonEntry } from './agendaEntryUtils';
import { loadedForDateKeys, withFetchAttempts } from './agendaLoadTestHelpers';
import {
	agendaEntriesForDate,
	isAgendaRangeReady,
	mergeFetchedAgendaForRange,
	needsAgendaDayFetch,
	needsAgendaRangeFetch,
} from './agendaLoadUtils';
import { parseDateKey, toISOFromDateKeyAndTime } from './dateUtils';

const todayKey = '2026-09-03';
const monday = parseDateKey('2026-09-01');
const friday = parseDateKey('2026-09-05');

describe('agendaEntriesForDate', () => {
	test('keeps only entries that start on the requested day', () => {
		const monday = lessonEntry({
			id: 1,
			heeftInhoud: false,
			heeftAantekening: false,
			onderwijstijd: 0,
			subtype: 'nvt',
			heeftBijlagen: false,
			herhaalStatus: 'geen',
			begin: toISOFromDateKeyAndTime('2026-09-01', '08:30'),
			einde: toISOFromDateKeyAndTime('2026-09-01', '09:30'),
			onderwerp: 'Wiskunde',
			type: 'les',
			deelnames: [],
			vakken: [],
			locaties: [],
			links: {},
		});
		const tuesday = lessonEntry({
			id: 2,
			heeftInhoud: false,
			heeftAantekening: false,
			onderwijstijd: 0,
			subtype: 'nvt',
			heeftBijlagen: false,
			herhaalStatus: 'geen',
			begin: toISOFromDateKeyAndTime('2026-09-02', '08:30'),
			einde: toISOFromDateKeyAndTime('2026-09-02', '09:30'),
			onderwerp: 'Nederlands',
			type: 'les',
			deelnames: [],
			vakken: [],
			locaties: [],
			links: {},
		});

		expect(agendaEntriesForDate([monday, tuesday], '2026-09-01')).toEqual([monday]);
	});
});

describe('mergeFetchedAgendaForRange', () => {
	test('marks days without entries as empty so the range is fully resolved', () => {
		const wednesday = lessonEntry({
			id: 1,
			heeftInhoud: false,
			heeftAantekening: false,
			onderwijstijd: 0,
			subtype: 'nvt',
			heeftBijlagen: false,
			herhaalStatus: 'geen',
			begin: toISOFromDateKeyAndTime('2026-09-03', '08:30'),
			einde: toISOFromDateKeyAndTime('2026-09-03', '09:30'),
			onderwerp: 'Wiskunde',
			type: 'les',
			deelnames: [],
			vakken: [],
			locaties: [],
			links: {},
		});
		const weekKeys = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'];
		const load = loadedForDateKeys(weekKeys);

		const merged = mergeFetchedAgendaForRange(undefined, { '2026-09-03': [wednesday] }, weekKeys);

		expect(merged['2026-09-03']).toEqual([wednesday]);
		expect(merged['2026-09-01']).toEqual([]);
		expect(merged['2026-09-05']).toEqual([]);
		expect(needsAgendaRangeFetch(merged, parseDateKey('2026-09-01'), parseDateKey('2026-09-05'), load)).toBe(false);
	});
});

describe('needsAgendaDayFetch', () => {
	test('returns false when agenda and load state are settled', () => {
		const agenda: Record<string, AgendaEntry[]> = { [todayKey]: [] };
		const load = loadedForDateKeys([todayKey]);

		expect(needsAgendaDayFetch(agenda, todayKey, load)).toBe(false);
	});

	test('returns true when load state is undefined', () => {
		const agenda: Record<string, AgendaEntry[]> = { [todayKey]: [] };

		expect(needsAgendaDayFetch(agenda, todayKey, undefined)).toBe(true);
	});
});

describe('absence notice load attempts', () => {
	test('still needs fetch when attempts remain below the limit', () => {
		const agenda: Record<string, AgendaEntry[]> = { [todayKey]: [] };
		const load = withFetchAttempts([todayKey], MAX_ABSENCE_NOTICE_FETCH_ATTEMPTS - 1);

		expect(needsAgendaDayFetch(agenda, todayKey, load)).toBe(true);
	});
});

describe('needsAgendaRangeFetch', () => {
	const weekKeys = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'];
	const load = loadedForDateKeys(weekKeys);

	test('returns false when every weekday is loaded', () => {
		const agenda = Object.fromEntries(weekKeys.map((key) => [key, []]));

		expect(needsAgendaRangeFetch(agenda, monday, friday, load)).toBe(false);
	});

	test('returns true when one weekday is missing', () => {
		const agenda = {
			'2026-09-01': [],
			'2026-09-02': [],
			'2026-09-03': [],
			'2026-09-04': [],
		};

		expect(needsAgendaRangeFetch(agenda, monday, friday, load)).toBe(true);
	});
});

describe('isAgendaRangeReady after fetch cap', () => {
	const weekKeys = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'];

	test('range is ready and no further fetch is needed when attempts are exhausted', () => {
		const agenda = Object.fromEntries(weekKeys.map((key) => [key, []]));

		let load: ReturnType<typeof loadedForDateKeys> | undefined;
		for (let index = 0; index < MAX_ABSENCE_NOTICE_FETCH_ATTEMPTS; index++) {
			load = applyFetchResult(load, [], weekKeys);
		}

		expect(needsAgendaRangeFetch(agenda, monday, friday, load)).toBe(false);
		expect(isAgendaRangeReady(agenda, monday, friday, load)).toBe(true);
	});
});
