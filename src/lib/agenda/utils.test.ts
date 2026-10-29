import { expect, setSystemTime, test } from 'bun:test';
import {
	getAgendaOccurrenceKey,
	getBreakPeriods,
	getCurrentLesson,
	getNextLesson,
	isSameAgendaOccurrence,
} from '@/lib/agenda/utils';

function setTime(time: string) {
	const [h, m] = time.split(':').map(Number);
	const date = new Date();
	date.setHours(h, m, 0, 0);

	setSystemTime(date);
}

test('Before 08:30 → before-school', () => {
	setTime('07:45');
	const cur = getCurrentLesson();
	expect(cur).toEqual({ status: 'before-school' });
	expect(getNextLesson(cur)).toEqual({
		status: 'lesson',
		lesson: 1,
		range: '08:30-09:10',
	});
});

test('During the first lesson (08:30–09:10) → lesson 1', () => {
	setTime('08:35');
	expect(getCurrentLesson()).toEqual({
		status: 'lesson',
		lesson: 1,
		range: '08:30-09:10',
	});
});

test('Exactly at 09:10 → start of lesson 2', () => {
	setTime('09:10');
	const cur = getCurrentLesson();
	const next = getNextLesson(cur);

	expect(cur).toEqual({
		status: 'lesson',
		lesson: 2,
		range: '09:10-09:50',
	});

	expect(next).toEqual({
		status: 'lesson',
		lesson: 3,
		range: '09:50-10:30',
	});
});

test('Exactly at 09:50 → start of lesson 3', () => {
	setTime('09:50');
	const cur = getCurrentLesson();
	const next = getNextLesson(cur);

	expect(cur).toEqual({
		status: 'lesson',
		lesson: 3,
		range: '09:50-10:30',
	});

	expect(next).toEqual({
		status: 'lesson',
		lesson: 4,
		range: '10:50-11:30',
	});
});

test('Exactly at 10:30 → start of break', () => {
	setTime('10:30');
	const cur = getCurrentLesson();
	const next = getNextLesson(cur);

	expect(cur).toEqual({
		status: 'break',
		lesson: 3,
		range: '10:30-10:50',
	});

	expect(next).toEqual({
		status: 'lesson',
		lesson: 4,
		range: '10:50-11:30',
	});
});

test('Exactly at 13:20 → start of lesson 7', () => {
	setTime('13:20');
	const cur = getCurrentLesson();
	expect(cur.status).toBe('lesson');
	expect(cur.lesson).toBe(7);
});

test('Exactly at 15:35 → lesson 10', () => {
	setTime('15:35');
	const cur = getCurrentLesson();
	const next = getNextLesson(cur);

	expect(cur).toEqual({
		status: 'lesson',
		lesson: 10,
		range: '15:20-16:00',
	});

	expect(next).toEqual({
		status: 'after-school',
	});
});

test('After 16:00 → after-school', () => {
	setTime('16:05');
	const cur = getCurrentLesson();
	expect(cur).toEqual({ status: 'after-school' });
	expect(getNextLesson(cur)).toEqual({ status: 'after-school' });
});

test('getBreakPeriods returns timetable gaps between lesson hours', () => {
	expect(getBreakPeriods()).toEqual([
		{ start: '10:30', end: '10:50' },
		{ start: '12:50', end: '13:20' },
	]);
});

test('isSameAgendaOccurrence distinguishes shared ids by begin', () => {
	const monday = { id: 42, begin: '2024-08-19T07:00:00.000Z' };
	const wednesday = { id: 42, begin: '2024-08-21T07:00:00.000Z' };

	expect(isSameAgendaOccurrence(monday, monday)).toBe(true);
	expect(isSameAgendaOccurrence(monday, wednesday)).toBe(false);
	expect(isSameAgendaOccurrence(monday, null)).toBe(false);
	expect(getAgendaOccurrenceKey(monday)).toBe('42:2024-08-19T07:00:00.000Z');
});
