import { describe, expect, test } from 'bun:test';
import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { formatReturnMeasureSummary } from './returnMeasureSummary';

function selection(start: string, end: string): AgendaSlotSelection {
	return {
		start: new Date(start),
		end: new Date(end),
	};
}

describe('formatReturnMeasureSummary', () => {
	test('formats a single-day summary', () => {
		const summary = formatReturnMeasureSummary(selection('2026-09-16T09:30:00', '2026-09-16T11:30:00'), 1);
		expect(summary).toBe('Terugkomen op woensdag 16 september 2026 om 09:30 - 11:30 (het 3e en 4e uur)');
	});

	test('formats a multi-day summary using school days only', () => {
		const summary = formatReturnMeasureSummary(selection('2026-09-16T09:30:00', '2026-09-16T11:30:00'), 8);
		expect(summary).toBe(
			'Terugkomen van woensdag 16 september - vrijdag 25 september 2026 om 09:30 - 11:30 (het 3e en 4e uur)',
		);
	});

	test('uses vierkant rooster label for a full-day selection', () => {
		const summary = formatReturnMeasureSummary(selection('2026-09-16T08:00:00', '2026-09-16T16:00:00'), 1);
		expect(summary).toBe('Terugkomen op woensdag 16 september 2026 om 08:00 - 16:00 (Vierkant rooster)');
	});

	test('skips weekends when counting school days', () => {
		const summary = formatReturnMeasureSummary(selection('2026-09-18T10:00:00', '2026-09-18T11:15:00'), 2);
		expect(summary).toBe(
			'Terugkomen van vrijdag 18 september - maandag 21 september 2026 om 10:00 - 11:15 (het 4e uur)',
		);
	});
});
