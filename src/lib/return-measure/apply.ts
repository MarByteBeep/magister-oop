import { replaceReturnMeasureEntries } from '@/lib/agenda/entryUtils';
import { groupScheduledReturnMeasures } from '@/lib/return-measure/utils';
import { getMonthKey, parseDateKey } from '@/lib/shared/dateUtils';
import { deepEqual } from '@/lib/utils';
import type { ReturnMeasureStudent, ScheduledReturnMeasure } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';
import type { StudentWrite } from '@/types/studentStore.types';

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
		const agenda = student.agenda;
		if (!agenda) return student;

		const byDate = byStudent.get(student.id) ?? new Map<string, ScheduledReturnMeasure[]>();
		let updatedAgenda: StudentWrite['agenda'] | null = null;

		for (const [key, dayEntries] of Object.entries(agenda)) {
			if (!key.startsWith(monthKey) && !byDate.has(key)) continue;

			const updatedDay = replaceReturnMeasureEntries(dayEntries, byDate.get(key) ?? []);
			if (deepEqual(dayEntries, updatedDay)) continue;

			updatedAgenda = { ...(updatedAgenda ?? agenda), [key]: updatedDay };
		}

		if (!updatedAgenda) return student;

		changed = true;
		return { ...student, agenda: updatedAgenda };
	});

	return changed ? next : students;
}
