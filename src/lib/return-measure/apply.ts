import { replaceReturnMeasureEntries } from '@/lib/agenda/entryUtils';
import { groupScheduledReturnMeasures } from '@/lib/return-measure/utils';
import { getMonthKey, parseDateKey } from '@/lib/shared/dateUtils';
import { deepEqual } from '@/lib/utils';
import type { ReturnMeasureStudent, ScheduledReturnMeasure } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';
import type { StudentWrite } from '@/types/studentStore.types';

type DayMeasuresByDate = Map<string, ScheduledReturnMeasure[]>;

function shouldUpdateAgendaDay(key: string, monthKey: string, byDate: DayMeasuresByDate): boolean {
	if (key.startsWith(monthKey)) return true;
	return byDate.has(key);
}

function measuresForStudent(byStudent: Map<number, DayMeasuresByDate>, studentId: number): DayMeasuresByDate {
	const existing = byStudent.get(studentId);
	if (existing) return existing;
	return new Map();
}

function dayMeasures(byDate: DayMeasuresByDate, key: string): ScheduledReturnMeasure[] {
	const existing = byDate.get(key);
	if (existing) return existing;
	return [];
}

function mergeUpdatedAgendaDay(
	updatedAgenda: StudentWrite['agenda'] | null,
	agenda: NonNullable<Student['agenda']>,
	key: string,
	updatedDay: NonNullable<Student['agenda']>[string],
): StudentWrite['agenda'] {
	if (updatedAgenda) return { ...updatedAgenda, [key]: updatedDay };
	return { ...agenda, [key]: updatedDay };
}

function applyAgendaDayUpdate(
	updatedAgenda: StudentWrite['agenda'] | null,
	agenda: NonNullable<Student['agenda']>,
	key: string,
	dayEntries: NonNullable<Student['agenda']>[string],
	byDate: DayMeasuresByDate,
): StudentWrite['agenda'] | null {
	const updatedDay = replaceReturnMeasureEntries(dayEntries, dayMeasures(byDate, key));
	if (deepEqual(dayEntries, updatedDay)) return updatedAgenda;
	return mergeUpdatedAgendaDay(updatedAgenda, agenda, key, updatedDay);
}

function updateStudentAgendaDays(
	agenda: NonNullable<Student['agenda']>,
	byDate: DayMeasuresByDate,
	monthKey: string,
): StudentWrite['agenda'] | null {
	let updatedAgenda: StudentWrite['agenda'] | null = null;

	for (const [key, dayEntries] of Object.entries(agenda)) {
		if (!shouldUpdateAgendaDay(key, monthKey, byDate)) continue;
		updatedAgenda = applyAgendaDayUpdate(updatedAgenda, agenda, key, dayEntries, byDate);
	}

	return updatedAgenda;
}

function nextStudentWithMeasures(
	student: Student,
	byStudent: Map<number, DayMeasuresByDate>,
	monthKey: string,
): { student: StudentWrite; changed: boolean } {
	const agenda = student.agenda;
	if (!agenda) return { student, changed: false };

	const updatedAgenda = updateStudentAgendaDays(agenda, measuresForStudent(byStudent, student.id), monthKey);
	if (!updatedAgenda) return { student, changed: false };

	return { student: { ...student, agenda: updatedAgenda }, changed: true };
}

/**
 * Replace return measure overlays on loaded agenda days in the refreshed month, plus any day
 * present in the bulk payload (e.g. a later month after a cross-month school-day span).
 */
export function applyReturnMeasuresToStudents(
	students: Student[],
	measures: ReturnMeasureStudent[],
	dateKey: string,
): StudentWrite[] {
	const monthKey = getMonthKey(parseDateKey(dateKey));
	const byStudent = groupScheduledReturnMeasures(measures);

	let changed = false;
	const next = students.map((student) => {
		const result = nextStudentWithMeasures(student, byStudent, monthKey);
		if (result.changed) changed = true;
		return result.student;
	});

	if (changed) return next;
	return students;
}
