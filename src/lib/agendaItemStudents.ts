import { isLessonEntry } from '@/lib/agendaEntryUtils';
import { agendaItemOverlapsLesson } from '@/lib/agendaUtils';
import { formatLocation } from '@/lib/locationUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/types/student.types';

export function findStudentsInAgendaLocation(
	students: Student[],
	dateKey: string,
	firstLocation: string,
	lessonStart: string,
	lessonEnd: string,
): Student[] {
	const studentsFound: Student[] = [];

	for (const student of students) {
		const agendaForDay = student.agenda?.[dateKey];
		if (!agendaForDay) continue;

		for (const dayEntry of agendaForDay) {
			if (!isLessonEntry(dayEntry)) continue;
			if (!agendaItemOverlapsLesson(dayEntry.item, lessonStart, lessonEnd)) continue;
			const itemLocations = dayEntry.item.locaties.map((loc) => formatLocation(loc)).filter(Boolean);
			if (itemLocations.includes(firstLocation)) {
				studentsFound.push(student);
				break;
			}
		}
	}

	return studentsFound;
}

export function resolveAgendaItemLocation(entry: AgendaEntry): { firstLocation: string; hasLocation: boolean } {
	const firstLocation = entry.kind === 'lesson' ? (formatLocation(entry.item.locaties[0]) ?? '') : '';
	return { firstLocation, hasLocation: firstLocation !== '' };
}
