import { replaceReturnMeasureEntries } from '@/lib/agendaEntryUtils';
import { getMonthKey, parseDateKey } from '@/lib/dateUtils';
import { groupScheduledReturnMeasures } from '@/lib/returnMeasureUtils';
import { deepEqual } from '@/lib/utils';
import type { ReturnMeasureStudent, ScheduledReturnMeasure } from '@/magister/response/return-measure.types';
import type { Student } from '@/magister/types';

/**
 * Replace return measure overlays on every loaded agenda day inside the fetched month.
 * `dateKey` is the day the bulk list was refreshed for; the payload covers its whole month.
 */
export function applyReturnMeasuresToStudents(
	students: Student[],
	measures: ReturnMeasureStudent[],
	dateKey: string,
): Student[] {
	const monthKey = getMonthKey(parseDateKey(dateKey));
	const byStudent = groupScheduledReturnMeasures(measures);

	let changed = false;
	const next = students.map((student) => {
		const agenda = student.agenda;
		if (!agenda) return student;

		const byDate = byStudent.get(student.id) ?? new Map<string, ScheduledReturnMeasure[]>();
		let updatedAgenda: Student['agenda'] | null = null;

		for (const [key, dayEntries] of Object.entries(agenda)) {
			if (!key.startsWith(monthKey)) continue;

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
