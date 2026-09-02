import { expect, test } from 'bun:test';
import { returnMeasureEntry } from '@/lib/agendaEntryUtils';
import type { ReturnMeasure } from '@/magister/response/return-measure.types';
import {
	configureFullDaySchedule,
	getFullDayScheduleLabel,
	isFullDayReturnMeasureEntry,
	resetFullDayScheduleConfig,
} from './fullDayScheduleUtils';

function measure(begin: string, einde: string): ReturnMeasure {
	return {
		id: 1,
		begin,
		einde,
		omschrijving: 'test',
		maatregel: null,
		links: {},
	};
}

test('isFullDayReturnMeasureEntry matches default 08:00–16:00 school day', () => {
	resetFullDayScheduleConfig();
	const entry = returnMeasureEntry(measure('2026-08-31T08:00:00', '2026-08-31T16:00:00'));
	expect(isFullDayReturnMeasureEntry(entry)).toBe(true);
	expect(isFullDayReturnMeasureEntry(returnMeasureEntry(measure('2026-08-31T08:30:00', '2026-08-31T09:30:00')))).toBe(
		false,
	);
	expect(getFullDayScheduleLabel()).toBe('Vierkant rooster');
});

test('configureFullDaySchedule allows school-specific times', () => {
	configureFullDaySchedule({ beginTime: '08:30', endTime: '15:30', label: 'Vierkant rooster' });
	expect(isFullDayReturnMeasureEntry(returnMeasureEntry(measure('2026-08-31T08:30:00', '2026-08-31T15:30:00')))).toBe(
		true,
	);
	expect(isFullDayReturnMeasureEntry(returnMeasureEntry(measure('2026-08-31T08:00:00', '2026-08-31T16:00:00')))).toBe(
		false,
	);
	expect(getFullDayScheduleLabel()).toBe('Vierkant rooster');
	resetFullDayScheduleConfig();
});
