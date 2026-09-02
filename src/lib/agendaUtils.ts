import { formatTime, getNow } from '@/lib/dateUtils';
import { formatLocations } from '@/lib/locationUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';

export const timeTable = [
	{ begin: '08:30', einde: '09:10' },
	{ begin: '09:10', einde: '09:50' },
	{ begin: '09:50', einde: '10:30' },
	{ begin: '10:50', einde: '11:30' },
	{ begin: '11:30', einde: '12:10' },
	{ begin: '12:10', einde: '12:50' },
	{ begin: '13:20', einde: '14:00' },
	{ begin: '14:00', einde: '14:40' },
	{ begin: '14:40', einde: '15:20' },
	{ begin: '15:20', einde: '16:00' },
];

export type LessonInfo = {
	status: 'before-school' | 'after-school' | 'break' | 'lesson';
	lesson?: number;
	range?: string;
};

export function getAgendaItemInfo(item: AgendaItem) {
	const locations = formatLocations(item.locaties);

	const courseCodes =
		item.vakken.length > 0
			? item.vakken
					.map((e) => e.code)
					.filter(Boolean)
					.join(', ')
			: undefined;

	const filteredTeachers = item.deelnames.filter((e) => e.type === 'medewerker');
	const teacherCodes = getTeacherCodes(item);

	const teachers =
		filteredTeachers.length > 0
			? filteredTeachers.map((e) => `${e.roepnaam} ${e.tussenvoegsel ?? ''} ${e.achternaam}`).join(', ')
			: undefined;

	const teachersCodes = teacherCodes.length > 0 ? teacherCodes.join(', ') : undefined;

	const courseDescriptions =
		item.vakken.length > 0
			? item.vakken
					.map((e) => e.omschrijving)
					.filter(Boolean)
					.join(', ')
			: undefined;

	const subject = item.onderwerp;

	return {
		subject,
		locations,
		courseCodes,
		courseDescriptions,
		teachers,
		teachersCodes,
		teacherCodes,
	};
}

/** Staff codes from an agenda item (medewerker participants only). */
export function getTeacherCodes(item: AgendaItem): string[] {
	return item.deelnames
		.filter((e) => e.type === 'medewerker')
		.map((e) => e.code)
		.filter((code): code is string => Boolean(code));
}

/** Compact label for tight UI: single code, or first code + "e.a." when multiple. */
export function formatCompactTeacherLabel(item: AgendaItem): string | undefined {
	const codes = getTeacherCodes(item);
	if (codes.length === 0) return undefined;
	if (codes.length === 1) return codes[0];
	return `${codes[0]} e.a.`;
}

export function getLesson(date: Date): LessonInfo {
	const time = formatTime(date);
	const first = timeTable[0];
	const last = timeTable[timeTable.length - 1];

	if (time < first.begin) return { status: 'before-school' };
	if (time >= last.einde) return { status: 'after-school' };

	for (let i = 0; i < timeTable.length; i++) {
		const slot = timeTable[i];
		const next = timeTable[i + 1];

		if (slot.begin <= time && time < slot.einde) {
			return {
				status: 'lesson',
				lesson: i + 1,
				range: `${slot.begin}-${slot.einde}`,
			};
		}

		if (next && slot.einde <= time && time < next.begin) {
			return {
				status: 'break',
				lesson: i + 1,
				range: `${slot.einde}-${next.begin}`,
			};
		}
	}

	throw new Error('unreachable');
}

export function getCurrentLesson(): LessonInfo {
	const now = getNow();
	return getLesson(now);
}

export function getNextLesson(current: LessonInfo): LessonInfo {
	if (current.status === 'before-school') {
		const slot = timeTable[0];
		return { status: 'lesson', lesson: 1, range: `${slot.begin}-${slot.einde}` };
	}

	if (current.status === 'after-school') {
		return current;
	}

	const next = (current.lesson ?? 0) + 1;

	if (next > timeTable.length) {
		return { status: 'after-school' };
	}

	const slot = timeTable[next - 1];
	return { status: 'lesson', lesson: next, range: `${slot.begin}-${slot.einde}` };
}

/** Recurring Magister appointments can reuse the same id across days; begin distinguishes occurrences. */
export function isSameAgendaOccurrence(
	a: Pick<AgendaItem, 'id' | 'begin'> | null | undefined,
	b: Pick<AgendaItem, 'id' | 'begin'> | null | undefined,
): boolean {
	return a != null && b != null && a.id === b.id && a.begin === b.begin;
}

export function getAgendaOccurrenceKey(item: Pick<AgendaItem, 'id' | 'begin'>): string {
	return `${item.id}:${item.begin}`;
}

export function getItemTimeRange(item: AgendaItem): { startTime: string; endTime: string } {
	const itemStart = new Date(item.begin);
	const itemEnd = new Date(item.einde);
	return {
		startTime: formatTime(itemStart),
		endTime: formatTime(itemEnd),
	};
}

export function agendaItemOverlapsLesson(item: AgendaItem, lessonStart: string, lessonEnd: string): boolean {
	const { startTime, endTime } = getItemTimeRange(item);
	return (startTime < lessonEnd && endTime > lessonStart) || (startTime === lessonStart && endTime === lessonEnd);
}

export function getItemLocationCodes(item: AgendaItem): string[] {
	return item.locaties
		.map((loc) => (loc.code ?? loc.omschrijving)?.trim().toLowerCase())
		.filter((loc): loc is string => Boolean(loc));
}
