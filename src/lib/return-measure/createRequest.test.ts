import { describe, expect, test } from 'bun:test';
import { buildCreateReturnMeasureRequest } from '@/lib/return-measure/createRequest';
import { parseDateKey, toISOFromDateKeyAndTime } from '@/lib/shared/dateUtils';

const now = parseDateKey('2026-09-01');

describe('buildCreateReturnMeasureRequest', () => {
	test('maps form fields to the Magister POST body', () => {
		const payload = buildCreateReturnMeasureRequest(
			{
				dateKey: '2026-09-16',
				startTime: '14:40',
				endTime: '16:00',
				description: 'Spijbelen NE 16/09',
				dayCount: 1,
			},
			now,
		);

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
			buildCreateReturnMeasureRequest(
				{
					dateKey: '2026-09-16',
					startTime: '16:00',
					endTime: '14:40',
					description: 'Ongeldig',
					dayCount: 1,
				},
				now,
			),
		).toBeNull();
	});

	test('rejects a past calendar day', () => {
		expect(
			buildCreateReturnMeasureRequest(
				{
					dateKey: '2026-08-31',
					startTime: '14:40',
					endTime: '16:00',
					description: 'Te laat',
					dayCount: 1,
				},
				now,
			),
		).toBeNull();
	});

	test('rejects a day count that is not a whole number of at least one', () => {
		const base = {
			dateKey: '2026-09-16',
			startTime: '14:40',
			endTime: '16:00',
			description: 'Spijbelen NE 16/09',
		};

		expect(buildCreateReturnMeasureRequest({ ...base, dayCount: Number.NaN }, now)).toBeNull();
		expect(buildCreateReturnMeasureRequest({ ...base, dayCount: 1.5 }, now)).toBeNull();
		expect(buildCreateReturnMeasureRequest({ ...base, dayCount: 0 }, now)).toBeNull();
	});
});
