import { describe, expect, test } from 'bun:test';
import { lessonEntry, returnMeasureEntry } from '@/lib/agenda/entryUtils';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { scheduledReturnMeasure } from '@/lib/return-measure/fixtures';
import {
	constrainRescheduleSelection,
	listRescheduleOverrideAlerts,
	nextSchoolDay,
	rescheduleReturnMeasureDescription,
	returnMeasureScheduleKind,
	suggestReturnMeasureReschedule,
} from '@/lib/return-measure/reschedule';
import { formatTime, getDateKey, parseDateKey, toISOFromDateKeyAndTime } from '@/lib/shared/dateUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

function lesson(
	dateKey: string,
	startTime: string,
	endTime: string,
	subject: { code: string; omschrijving: string } = { code: 'WI', omschrijving: 'Wiskunde' },
): AgendaEntry {
	const item = {
		id: Number(`${dateKey.replace(/-/g, '')}${startTime.replace(':', '')}`),
		begin: toISOFromDateKeyAndTime(dateKey, startTime),
		einde: toISOFromDateKeyAndTime(dateKey, endTime),
		titel: 'Les',
		omschrijving: null,
		onderwerp: subject.omschrijving,
		locaties: [],
		vakken: [{ id: 1, code: subject.code, omschrijving: subject.omschrijving, links: {} }],
		deelnames: [],
	} as unknown as AgendaItem;
	return lessonEntry(item);
}

function measure(dateKey: string, startTime: string, endTime: string): AgendaEntry {
	return returnMeasureEntry(
		scheduledReturnMeasure(toISOFromDateKeyAndTime(dateKey, startTime), toISOFromDateKeyAndTime(dateKey, endTime)),
	);
}

/** Fixed "today" so fixture dates in September 2026 stay plannable in tests. */
const now = parseDateKey('2026-09-15');

function requireSuggestion(start: Date, end: Date, agenda: Map<string, AgendaEntry[]>): AgendaSlotSelection {
	const suggestion = suggestReturnMeasureReschedule(start, end, agenda, now);
	expect(suggestion).not.toBeNull();
	if (!suggestion) throw new Error('Expected a reschedule suggestion');
	return suggestion;
}

describe('nextSchoolDay', () => {
	test('moves Thursday to Friday', () => {
		expect(getDateKey(nextSchoolDay(parseDateKey('2026-09-17')))).toBe('2026-09-18');
	});

	test('skips the weekend from Friday', () => {
		expect(getDateKey(nextSchoolDay(parseDateKey('2026-09-18')))).toBe('2026-09-21');
	});
});

describe('returnMeasureScheduleKind', () => {
	test('detects vierkant rooster', () => {
		const start = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:00'));
		const end = new Date(toISOFromDateKeyAndTime('2026-09-16', '16:00'));
		expect(returnMeasureScheduleKind(start, end)).toBe('full-day');
	});

	test('detects 8 uur melden', () => {
		const start = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:00'));
		const end = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:30'));
		expect(returnMeasureScheduleKind(start, end)).toBe('pre-school');
	});

	test('detects hour return', () => {
		const start = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:30'));
		const end = new Date(toISOFromDateKeyAndTime('2026-09-16', '09:30'));
		expect(returnMeasureScheduleKind(start, end)).toBe('hour');
	});
});

describe('suggestReturnMeasureReschedule', () => {
	test('moves vierkant rooster to the next school day', () => {
		const start = new Date(toISOFromDateKeyAndTime('2026-09-18', '08:00'));
		const end = new Date(toISOFromDateKeyAndTime('2026-09-18', '16:00'));
		const suggestion = requireSuggestion(start, end, new Map());
		expect(getDateKey(suggestion.start)).toBe('2026-09-21');
		expect(formatTime(suggestion.start)).toBe('08:00');
		expect(formatTime(suggestion.end)).toBe('16:00');
	});

	test('moves 8 uur melden to the next school day', () => {
		const start = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:00'));
		const end = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:30'));
		const suggestion = requireSuggestion(start, end, new Map());
		expect(getDateKey(suggestion.start)).toBe('2026-09-17');
		expect(formatTime(suggestion.start)).toBe('08:00');
		expect(formatTime(suggestion.end)).toBe('08:30');
	});

	test('places hour return in the first free lesson hour', () => {
		const start = new Date(toISOFromDateKeyAndTime('2026-09-16', '10:50'));
		const end = new Date(toISOFromDateKeyAndTime('2026-09-16', '11:30'));
		const nextKey = '2026-09-17';
		const agenda = new Map<string, AgendaEntry[]>([
			[
				nextKey,
				[
					lesson(nextKey, '08:30', '09:10'),
					lesson(nextKey, '09:10', '09:50'),
					lesson(nextKey, '09:50', '10:30'),
				],
			],
		]);

		const suggestion = requireSuggestion(start, end, agenda);
		expect(getDateKey(suggestion.start)).toBe(nextKey);
		expect(formatTime(suggestion.start)).toBe('10:50');
		expect(formatTime(suggestion.end)).toBe('11:30');
	});

	test('skips a fully booked day and uses the next free school day', () => {
		const start = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:30'));
		const end = new Date(toISOFromDateKeyAndTime('2026-09-16', '09:10'));
		const busyKey = '2026-09-17';
		const freeKey = '2026-09-18';
		const allLessonSlots = [
			['08:30', '09:10'],
			['09:10', '09:50'],
			['09:50', '10:30'],
			['10:50', '11:30'],
			['11:30', '12:10'],
			['12:10', '12:50'],
			['13:20', '14:00'],
			['14:00', '14:40'],
			['14:40', '15:20'],
			['15:20', '16:00'],
		] as const;

		const agenda = new Map<string, AgendaEntry[]>([
			[busyKey, allLessonSlots.map(([slotStart, slotEnd]) => lesson(busyKey, slotStart, slotEnd))],
			[freeKey, [lesson(freeKey, '08:30', '09:10')]],
		]);

		const suggestion = requireSuggestion(start, end, agenda);
		expect(getDateKey(suggestion.start)).toBe(freeKey);
		expect(formatTime(suggestion.start)).toBe('09:10');
		expect(formatTime(suggestion.end)).toBe('09:50');
	});

	test('skips a day that already has 8 uur melden', () => {
		const start = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:00'));
		const end = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:30'));
		const busyKey = '2026-09-17';
		const freeKey = '2026-09-18';
		const agenda = new Map<string, AgendaEntry[]>([[busyKey, [measure(busyKey, '08:00', '08:30')]]]);

		const suggestion = requireSuggestion(start, end, agenda);
		expect(getDateKey(suggestion.start)).toBe(freeKey);
		expect(formatTime(suggestion.start)).toBe('08:00');
		expect(formatTime(suggestion.end)).toBe('08:30');
	});

	test('skips a day that already has a vierkant rooster', () => {
		const start = new Date(toISOFromDateKeyAndTime('2026-09-18', '08:00'));
		const end = new Date(toISOFromDateKeyAndTime('2026-09-18', '16:00'));
		const busyKey = '2026-09-21';
		const freeKey = '2026-09-22';
		const agenda = new Map<string, AgendaEntry[]>([[busyKey, [measure(busyKey, '08:00', '16:00')]]]);

		const suggestion = requireSuggestion(start, end, agenda);
		expect(getDateKey(suggestion.start)).toBe(freeKey);
	});
});

describe('constrainRescheduleSelection', () => {
	test('rejects a pick on a past calendar day', () => {
		const originalStart = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:00'));
		const originalEnd = new Date(toISOFromDateKeyAndTime('2026-09-16', '16:00'));
		const picked = {
			start: new Date(toISOFromDateKeyAndTime('2026-09-14', '10:50')),
			end: new Date(toISOFromDateKeyAndTime('2026-09-14', '11:30')),
		};
		expect(constrainRescheduleSelection('full-day', originalStart, originalEnd, picked, now)).toBeNull();
	});

	test('allows overriding a full-day original to a single lesson hour', () => {
		const originalStart = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:00'));
		const originalEnd = new Date(toISOFromDateKeyAndTime('2026-09-16', '16:00'));
		const picked = {
			start: new Date(toISOFromDateKeyAndTime('2026-09-17', '10:50')),
			end: new Date(toISOFromDateKeyAndTime('2026-09-17', '11:30')),
		};
		const constrained = constrainRescheduleSelection('full-day', originalStart, originalEnd, picked, now);
		expect(constrained).not.toBeNull();
		if (!constrained) throw new Error('Expected constrained selection');
		expect(getDateKey(constrained.start)).toBe('2026-09-17');
		expect(formatTime(constrained.start)).toBe('10:50');
		expect(formatTime(constrained.end)).toBe('11:30');
	});

	test('allows overriding 8 uur melden to another lesson hour', () => {
		const originalStart = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:00'));
		const originalEnd = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:30'));
		const picked = {
			start: new Date(toISOFromDateKeyAndTime('2026-09-18', '13:20')),
			end: new Date(toISOFromDateKeyAndTime('2026-09-18', '14:00')),
		};
		const constrained = constrainRescheduleSelection('pre-school', originalStart, originalEnd, picked, now);
		expect(constrained).not.toBeNull();
		if (!constrained) throw new Error('Expected constrained selection');
		expect(getDateKey(constrained.start)).toBe('2026-09-18');
		expect(formatTime(constrained.start)).toBe('13:20');
		expect(formatTime(constrained.end)).toBe('14:00');
	});

	test('keeps the picked lesson-hour span when overriding duration', () => {
		const originalStart = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:30'));
		const originalEnd = new Date(toISOFromDateKeyAndTime('2026-09-16', '09:50'));
		const picked = {
			start: new Date(toISOFromDateKeyAndTime('2026-09-17', '10:50')),
			end: new Date(toISOFromDateKeyAndTime('2026-09-17', '11:30')),
		};
		const constrained = constrainRescheduleSelection('hour', originalStart, originalEnd, picked, now);
		expect(constrained).not.toBeNull();
		if (!constrained) throw new Error('Expected constrained selection');
		expect(getDateKey(constrained.start)).toBe('2026-09-17');
		expect(formatTime(constrained.start)).toBe('10:50');
		expect(formatTime(constrained.end)).toBe('11:30');
	});

	test('rejects a pick that overlaps an existing return measure', () => {
		const originalStart = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:00'));
		const originalEnd = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:30'));
		const picked = {
			start: new Date(toISOFromDateKeyAndTime('2026-09-18', '08:00')),
			end: new Date(toISOFromDateKeyAndTime('2026-09-18', '08:30')),
		};
		const dayEntries = [measure('2026-09-18', '08:00', '08:30')];
		expect(
			constrainRescheduleSelection('pre-school', originalStart, originalEnd, picked, now, dayEntries),
		).toBeNull();
	});

	test('allows an hour pick that overlaps a lesson', () => {
		const originalStart = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:30'));
		const originalEnd = new Date(toISOFromDateKeyAndTime('2026-09-16', '09:10'));
		const picked = {
			start: new Date(toISOFromDateKeyAndTime('2026-09-17', '10:50')),
			end: new Date(toISOFromDateKeyAndTime('2026-09-17', '11:30')),
		};
		const dayEntries = [lesson('2026-09-17', '10:50', '11:30')];
		const constrained = constrainRescheduleSelection('hour', originalStart, originalEnd, picked, now, dayEntries);
		expect(constrained).not.toBeNull();
		if (!constrained) throw new Error('Expected constrained selection');
		expect(formatTime(constrained.start)).toBe('10:50');
		expect(formatTime(constrained.end)).toBe('11:30');
	});
});

describe('listRescheduleOverrideAlerts', () => {
	test('lists kind and duration when 8 uur melden becomes a normal lesson hour', () => {
		const originalStart = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:00'));
		const originalEnd = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:30'));
		const selection = {
			start: new Date(toISOFromDateKeyAndTime('2026-09-17', '10:50')),
			end: new Date(toISOFromDateKeyAndTime('2026-09-17', '11:30')),
		};
		expect(listRescheduleOverrideAlerts(originalStart, originalEnd, selection)).toEqual([
			{ type: 'kind', from: 'pre-school', to: 'hour' },
			{ type: 'duration', fromMinutes: 30, toMinutes: 40 },
		]);
	});

	test('lists duration and hour count when a two-hour return becomes one hour', () => {
		const originalStart = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:30'));
		const originalEnd = new Date(toISOFromDateKeyAndTime('2026-09-16', '09:50'));
		const selection = {
			start: new Date(toISOFromDateKeyAndTime('2026-09-17', '10:50')),
			end: new Date(toISOFromDateKeyAndTime('2026-09-17', '11:30')),
		};
		expect(listRescheduleOverrideAlerts(originalStart, originalEnd, selection)).toEqual([
			{ type: 'duration', fromMinutes: 80, toMinutes: 40 },
			{ type: 'hourCount', from: 2, to: 1 },
		]);
	});

	test('is empty when the same shape is kept on another day', () => {
		const originalStart = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:30'));
		const originalEnd = new Date(toISOFromDateKeyAndTime('2026-09-16', '09:10'));
		const selection = {
			start: new Date(toISOFromDateKeyAndTime('2026-09-17', '10:50')),
			end: new Date(toISOFromDateKeyAndTime('2026-09-17', '11:30')),
		};
		expect(listRescheduleOverrideAlerts(originalStart, originalEnd, selection)).toEqual([]);
	});

	test('lists overlapsLesson with the subject when the pick covers an existing lesson', () => {
		const originalStart = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:00'));
		const originalEnd = new Date(toISOFromDateKeyAndTime('2026-09-16', '08:30'));
		const selection = {
			start: new Date(toISOFromDateKeyAndTime('2026-09-17', '10:50')),
			end: new Date(toISOFromDateKeyAndTime('2026-09-17', '11:30')),
		};
		const dayEntries = [lesson('2026-09-17', '10:50', '11:30', { code: 'NE', omschrijving: 'Nederlands' })];
		expect(listRescheduleOverrideAlerts(originalStart, originalEnd, selection, dayEntries)).toContainEqual({
			type: 'overlapsLesson',
			subjects: ['Nederlands'],
		});
	});
});

describe('suggestReturnMeasureReschedule past clamp', () => {
	test('does not suggest a day before today when the next school day is already past', () => {
		const start = new Date(toISOFromDateKeyAndTime('2026-09-01', '08:00'));
		const end = new Date(toISOFromDateKeyAndTime('2026-09-01', '16:00'));
		const suggestion = requireSuggestion(start, end, new Map());
		expect(getDateKey(suggestion.start)).toBe('2026-09-15');
	});
});

describe('rescheduleReturnMeasureDescription', () => {
	test('matches the known not-reported wording', () => {
		expect(rescheduleReturnMeasureDescription(parseDateKey('2026-06-24'))).toBe('Niet gemeld op 24/06/2026');
	});
});
