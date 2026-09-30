import { describe, expect, test } from 'bun:test';
import { returnMeasureStudent } from '@/lib/return-measure/fixtures';
import { getReturnMeasureHandledInfo, returnMeasureSpanMonthKeys } from '@/lib/return-measure/utils';

describe('returnMeasureSpanMonthKeys', () => {
	test('returns one month for a single-day span', () => {
		expect(returnMeasureSpanMonthKeys('2026-09-16', 1)).toEqual(['2026-09']);
	});

	test('includes every month crossed by a multi-day school span', () => {
		expect(returnMeasureSpanMonthKeys('2026-09-29', 3)).toEqual(['2026-09', '2026-10']);
	});
});

describe('getReturnMeasureHandledInfo', () => {
	test('returns nulls when the measure was never handled', () => {
		expect(getReturnMeasureHandledInfo(returnMeasureStudent())).toEqual({
			handledBy: null,
			handledAt: null,
		});
	});

	test('formats handler name and handled-at label', () => {
		const info = getReturnMeasureHandledInfo(
			returnMeasureStudent({
				afgehandeldOp: '2026-09-30T07:30:00.000Z',
				afgehandeldDoor: {
					id: 9,
					persoonType: 'medewerker',
					voorletters: 'J.',
					roepnaam: 'Jan',
					tussenvoegsel: 'de',
					achternaam: 'Vries',
					links: { self: { href: '/api/medewerkers/9' } },
				},
			}),
		);
		expect(info.handledBy).toBe('Jan de Vries');
		expect(info.handledAt).toMatch(/om \d{2}:\d{2}$/);
	});
});
