import { describe, expect, test } from 'bun:test';
import { isAllDaySlotSelection } from './agendaSlotSelection';

describe('isAllDaySlotSelection', () => {
	test('detects react-big-calendar all-day header slots', () => {
		expect(
			isAllDaySlotSelection({
				start: new Date('2026-09-17T00:00:00'),
				end: new Date('2026-09-18T00:00:00'),
			}),
		).toBe(true);
	});

	test('rejects timed lesson-hour selections', () => {
		expect(
			isAllDaySlotSelection({
				start: new Date('2026-09-17T08:00:00'),
				end: new Date('2026-09-17T16:00:00'),
			}),
		).toBe(false);
	});
});
