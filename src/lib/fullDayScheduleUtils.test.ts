import { expect, test } from 'bun:test';
import type { AgendaItem } from '@/magister/response/agenda.types';
import {
	configureFullDaySchedule,
	getFullDayScheduleLabel,
	isFullDaySchedule,
	resetFullDayScheduleConfig,
} from './fullDayScheduleUtils';
import { RETURN_MEASURE_AGENDA_TYPE } from './returnMeasureUtils';

function measureItem(begin: string, einde: string): AgendaItem {
	return {
		id: 1,
		heeftInhoud: false,
		heeftAantekening: false,
		onderwijstijd: 0,
		subtype: 'nvt',
		heeftBijlagen: false,
		herhaalStatus: 'geen',
		begin,
		einde,
		onderwerp: 'test',
		type: RETURN_MEASURE_AGENDA_TYPE,
		deelnames: [],
		vakken: [],
		locaties: [],
		links: {},
	};
}

test('isFullDaySchedule matches default 08:00–16:00 school day', () => {
	resetFullDayScheduleConfig();
	expect(isFullDaySchedule(measureItem('2026-08-31T08:00:00', '2026-08-31T16:00:00'))).toBe(true);
	expect(isFullDaySchedule(measureItem('2026-08-31T08:30:00', '2026-08-31T09:30:00'))).toBe(false);
	expect(getFullDayScheduleLabel()).toBe('Vierkant rooster');
});

test('configureFullDaySchedule allows school-specific times', () => {
	configureFullDaySchedule({ beginTime: '08:30', endTime: '15:30', label: 'Vierkant rooster' });
	expect(isFullDaySchedule(measureItem('2026-08-31T08:30:00', '2026-08-31T15:30:00'))).toBe(true);
	expect(isFullDaySchedule(measureItem('2026-08-31T08:00:00', '2026-08-31T16:00:00'))).toBe(false);
	expect(getFullDayScheduleLabel()).toBe('Vierkant rooster');
	resetFullDayScheduleConfig();
});
