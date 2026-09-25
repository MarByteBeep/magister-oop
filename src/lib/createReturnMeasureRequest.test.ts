import { describe, expect, test } from 'bun:test';
import { buildCreateReturnMeasureRequest } from './createReturnMeasureRequest';
import { toISOFromDateKeyAndTime } from './dateUtils';

describe('buildCreateReturnMeasureRequest', () => {
	test('maps form fields to the Magister POST body', () => {
		const payload = buildCreateReturnMeasureRequest({
			dateKey: '2026-09-16',
			startTime: '14:40',
			endTime: '16:00',
			description: 'Spijbelen NE 16/09',
			dayCount: 1,
		});

		expect(payload).toEqual({
			omschrijving: 'Spijbelen NE 16/09',
			terugkomenOp: toISOFromDateKeyAndTime('2026-09-16', '00:00'),
			beginTijd: '14:40',
			eindTijd: '16:00',
			aantalDagen: '1',
		});
	});

	test('returns null for invalid input', () => {
		expect(
			buildCreateReturnMeasureRequest({
				dateKey: '2026-09-16',
				startTime: '16:00',
				endTime: '14:40',
				description: 'Ongeldig',
				dayCount: 1,
			}),
		).toBeNull();
	});

	test('rejects a day count that is not a whole number of at least one', () => {
		const base = {
			dateKey: '2026-09-16',
			startTime: '14:40',
			endTime: '16:00',
			description: 'Spijbelen NE 16/09',
		};

		expect(buildCreateReturnMeasureRequest({ ...base, dayCount: Number.NaN })).toBeNull();
		expect(buildCreateReturnMeasureRequest({ ...base, dayCount: 1.5 })).toBeNull();
		expect(buildCreateReturnMeasureRequest({ ...base, dayCount: 0 })).toBeNull();
	});
});
