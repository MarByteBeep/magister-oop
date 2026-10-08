import { describe, expect, test } from 'bun:test';
import { hoveredSlotFromSelection, resolveAgendaHoverSelection } from '@/hooks/agenda/resolveAgendaHoverSelection';
import { constrainRescheduleSelection } from '@/lib/return-measure/reschedule';
import { formatTime, toISOFromDateKeyAndTime } from '@/lib/shared/dateUtils';

describe('resolveAgendaHoverSelection', () => {
	test('returns null without a hovered slot', () => {
		expect(resolveAgendaHoverSelection(null)).toBeNull();
	});

	test('keeps the raw lesson hour without a transform', () => {
		const selection = resolveAgendaHoverSelection({
			dateKey: '2026-10-08',
			startTime: '08:30',
			endTime: '09:10',
		});
		expect(selection).not.toBeNull();
		if (!selection) throw new Error('Expected selection');
		expect(formatTime(selection.start)).toBe('08:30');
		expect(formatTime(selection.end)).toBe('09:10');
	});

	test('keeps the hovered hour when reschedule allows override', () => {
		const originalStart = new Date(toISOFromDateKeyAndTime('2026-10-07', '08:00'));
		const originalEnd = new Date(toISOFromDateKeyAndTime('2026-10-07', '16:00'));
		const selection = resolveAgendaHoverSelection(
			{ dateKey: '2026-10-08', startTime: '08:30', endTime: '09:10' },
			(picked) => constrainRescheduleSelection('full-day', originalStart, originalEnd, picked),
		);
		expect(selection).not.toBeNull();
		if (!selection) throw new Error('Expected selection');
		expect(formatTime(selection.start)).toBe('08:30');
		expect(formatTime(selection.end)).toBe('09:10');
	});

	test('keeps a single-hour hover for a multi-hour original', () => {
		const originalStart = new Date(toISOFromDateKeyAndTime('2026-10-07', '08:30'));
		const originalEnd = new Date(toISOFromDateKeyAndTime('2026-10-07', '09:50'));
		const selection = resolveAgendaHoverSelection(
			{ dateKey: '2026-10-08', startTime: '10:50', endTime: '11:30' },
			(picked) => constrainRescheduleSelection('hour', originalStart, originalEnd, picked),
		);
		expect(selection).not.toBeNull();
		if (!selection) throw new Error('Expected selection');
		expect(formatTime(selection.start)).toBe('10:50');
		expect(formatTime(selection.end)).toBe('11:30');
	});
});

describe('hoveredSlotFromSelection', () => {
	test('round-trips selection times onto a hover slot', () => {
		const selection = resolveAgendaHoverSelection(
			{ dateKey: '2026-10-08', startTime: '08:30', endTime: '09:10' },
			(picked) =>
				constrainRescheduleSelection(
					'full-day',
					new Date(toISOFromDateKeyAndTime('2026-10-07', '08:00')),
					new Date(toISOFromDateKeyAndTime('2026-10-07', '16:00')),
					picked,
				),
		);
		expect(selection).not.toBeNull();
		if (!selection) throw new Error('Expected selection');
		expect(hoveredSlotFromSelection(selection)).toEqual({
			dateKey: '2026-10-08',
			startTime: '08:30',
			endTime: '09:10',
		});
	});
});
