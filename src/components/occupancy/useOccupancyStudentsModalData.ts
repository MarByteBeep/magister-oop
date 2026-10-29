import { useCallback, useMemo } from 'react';
import { isLessonEntry } from '@/lib/agenda/entryUtils';
import { agendaItemOverlapsLesson, getAgendaItemInfo, getItemLocationCodes } from '@/lib/agenda/utils';
import { getStudentsForLessonRange } from '@/lib/occupancy/utils';
import { sortAndGroupStudentsByClass } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

export type OccupancyClassGroup = {
	className: string;
	subject?: string;
	teacher?: string;
	students: Student[];
};

function formatTeacherLabel(entry: AgendaEntry): string | undefined {
	if (!isLessonEntry(entry)) return undefined;
	const teachers = entry.item.deelnames.filter((participant) => participant.type === 'medewerker');
	if (teachers.length === 0) return undefined;

	return teachers
		.map((teacher) => {
			const name = `${teacher.roepnaam} ${teacher.tussenvoegsel ?? ''} ${teacher.achternaam}`.trim();
			return `${name} (${teacher.code})`;
		})
		.join(', ');
}

function agendaForStudentDay(student: Student | undefined, dateKey: string): AgendaEntry[] | undefined {
	if (student === undefined) return undefined;
	const agenda = student.agenda;
	if (agenda === undefined) return undefined;
	return agenda[dateKey];
}

function pickSubject(courseDescriptions: string | undefined, subject: string | undefined): string | undefined {
	if (courseDescriptions !== undefined) return courseDescriptions;
	return subject;
}

function lessonGroupMeta(item: AgendaEntry): Pick<OccupancyClassGroup, 'subject' | 'teacher'> {
	if (!isLessonEntry(item)) return { teacher: formatTeacherLabel(item) };
	const info = getAgendaItemInfo(item.item);
	return {
		subject: pickSubject(info.courseDescriptions, info.subject),
		teacher: formatTeacherLabel(item),
	};
}

function buildLessonClassGroup(
	className: string,
	studentsInClass: Student[],
	dateKey: string,
	matchingAgendaItems: (agendaForDay: AgendaEntry[]) => AgendaEntry[],
): OccupancyClassGroup {
	const agendaForDay = agendaForStudentDay(studentsInClass[0], dateKey);
	if (agendaForDay === undefined) return { className, students: studentsInClass };

	const item = matchingAgendaItems(agendaForDay)[0];
	if (item === undefined) return { className, students: studentsInClass };

	return { className, students: studentsInClass, ...lessonGroupMeta(item) };
}

function buildClassGroups(
	students: Student[],
	dateKey: string,
	matchingAgendaItems: (agendaForDay: AgendaEntry[]) => AgendaEntry[],
	includeLessonInfo: boolean,
): OccupancyClassGroup[] {
	const grouped = sortAndGroupStudentsByClass(students);

	return Object.entries(grouped).map(([className, studentsInClass]) => {
		if (!includeLessonInfo) return { className, students: studentsInClass };
		return buildLessonClassGroup(className, studentsInClass, dateKey, matchingAgendaItems);
	});
}

export function useOccupancyStudentsModalData(
	students: Student[],
	dateKey: string,
	lessonRange: string,
	locations: string[],
) {
	const [lessonStart, lessonEnd] = lessonRange.split('-');
	const normalizedLocations = useMemo(
		() => new Set(locations.map((location) => location.trim().toLowerCase())),
		[locations],
	);

	const matchingAgendaItems = useCallback(
		(agendaForDay: AgendaEntry[]) =>
			agendaForDay.filter(
				(entry) =>
					isLessonEntry(entry) &&
					agendaItemOverlapsLesson(entry.item, lessonStart, lessonEnd) &&
					getItemLocationCodes(entry.item).some((code) => normalizedLocations.has(code)),
			),
		[lessonStart, lessonEnd, normalizedLocations],
	);

	const { withLesson, withBreak } = useMemo(
		() => getStudentsForLessonRange(lessonRange, students, dateKey, locations),
		[lessonRange, students, dateKey, locations],
	);

	const studentsWithLesson = useMemo(
		() => buildClassGroups(withLesson, dateKey, matchingAgendaItems, true),
		[withLesson, dateKey, matchingAgendaItems],
	);

	const studentsWithBreak = useMemo(
		() => buildClassGroups(withBreak, dateKey, matchingAgendaItems, false),
		[withBreak, dateKey, matchingAgendaItems],
	);

	return { studentsWithLesson, studentsWithBreak };
}
