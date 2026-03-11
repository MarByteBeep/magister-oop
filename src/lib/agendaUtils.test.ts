import { expect, setSystemTime, test } from 'bun:test';
import { getCurrentLesson, getNextLesson } from './agendaUtils';

// ------------------------------------------------------------
// HELPER – mock the time
// ------------------------------------------------------------
function setTime(time: string) {
	const [h, m] = time.split(':').map(Number);
	const date = new Date();
	date.setHours(h, m, 0, 0);

	setSystemTime(date);
}

// ------------------------------------------------------------
// Time generator
// ------------------------------------------------------------
function generateTimes() {
	const times: string[] = [];
	let h = 7;
	let m = 30;

	while (h < 17 || (h === 17 && m <= 30)) {
		times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
		m += 10;
		if (m >= 60) {
			m = 0;
			h++;
		}
	}
	return times;
}

const times = generateTimes();

// ------------------------------------------------------------
// MAIN TEST
// ------------------------------------------------------------
test('getCurrentLesson() & getNextLesson() work for all times 07:30–17:30', () => {
	for (const time of times) {
		setTime(time);

		const current = getCurrentLesson();
		const next = getNextLesson(current);

		expect(current).toBeDefined();
		expect(next).toBeDefined();

		// before-school should only occur before 08:30
		if (time < '08:30') {
			expect(current.status).toBe('before-school');
			expect(next.status).toBe('lesson');
		}

		// after-school should only occur after 16:00
		if (time >= '16:00') {
			expect(current.status).toBe('after-school');
			expect(next.status).toBe('after-school');
		}
	}
});

// ------------------------------------------------------------
// SPECIFIC TESTS
// ------------------------------------------------------------

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
