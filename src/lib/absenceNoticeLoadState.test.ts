import { describe, expect, test } from 'bun:test';
import {
	type AbsenceNoticeLoadDayState,
	applyFetchResult,
	isFetchSettled,
	MAX_ABSENCE_NOTICE_FETCH_ATTEMPTS,
	resetDays,
} from './absenceNoticeLoadState';
import { withFetchAttempts } from './agendaLoadTestHelpers';

const weekKeys = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'];

describe('applyFetchResult without refresh reset', () => {
	test('accumulates failed fetch attempts across auto-load rounds', () => {
		let load: Record<string, AbsenceNoticeLoadDayState> | undefined;
		for (let index = 0; index < MAX_ABSENCE_NOTICE_FETCH_ATTEMPTS; index++) {
			load = applyFetchResult(load, [], weekKeys);
		}

		for (const dateKey of weekKeys) {
			expect(isFetchSettled(load, dateKey)).toBe(true);
			expect(load?.[dateKey]?.fetchAttempts).toBe(MAX_ABSENCE_NOTICE_FETCH_ATTEMPTS);
		}
	});

	test('refresh reset clears attempts before the next fetch result is applied', () => {
		let load: Record<string, AbsenceNoticeLoadDayState> | undefined = withFetchAttempts(
			weekKeys,
			MAX_ABSENCE_NOTICE_FETCH_ATTEMPTS - 1,
		);
		load = resetDays(load, weekKeys);
		load = applyFetchResult(load, [], weekKeys);

		for (const dateKey of weekKeys) {
			expect(isFetchSettled(load, dateKey)).toBe(false);
			expect(load?.[dateKey]?.fetchAttempts).toBe(1);
		}
	});
});
