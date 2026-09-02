import { useCallback, useMemo } from 'react';
import { isLessonEntry } from '@/lib/agendaEntryUtils';
import { agendaItemOverlapsLesson, getAgendaItemInfo, getItemLocationCodes } from '@/lib/agendaUtils';
import { getStudentsForLessonRange } from '@/lib/occupancyUtils';
import { sortAndGroupStudentsByClass } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/magister/types';

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

function buildClassGroups(
	students: Student[],
	dateKey: string,
	matchingAgendaItems: (agendaForDay: NonNullable<Student['agenda']>[string]) => AgendaEntry[],
	includeLessonInfo: boolean,
): OccupancyClassGroup[] {
	const grouped = sortAndGroupStudentsByClass(students);

	return Object.entries(grouped).map(([className, studentsInClass]) => {
		if (!includeLessonInfo) {
			return { className, students: studentsInClass };
		}

		const agendaForDay = studentsInClass[0]?.agenda?.[dateKey];
		const item = agendaForDay ? matchingAgendaItems(agendaForDay)[0] : undefined;

		if (!item) {
			return { className, students: studentsInClass };
		}

		const { courseDescriptions, subject } = isLessonEntry(item) ? getAgendaItemInfo(item.item) : {};
		const rawSubject = courseDescriptions ?? subject;
		const rawTeacher = formatTeacherLabel(item);

		return {
			className,
			subject: rawSubject,
			teacher: rawTeacher,
			students: studentsInClass,
		};
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
		(agendaForDay: NonNullable<Student['agenda']>[string]) =>
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
