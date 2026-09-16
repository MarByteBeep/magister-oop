import { formatTime, getNow } from '@/lib/dateUtils';
import { formatLocations } from '@/lib/locationUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';

export type BreakPeriod = {
	start: string;
	end: string;
};

export type TimeSlot = {
	start: string;
	end: string;
};

export const timeTable: TimeSlot[] = [
	{ start: '08:30', end: '09:10' },
	{ start: '09:10', end: '09:50' },
	{ start: '09:50', end: '10:30' },
	{ start: '10:50', end: '11:30' },
	{ start: '11:30', end: '12:10' },
	{ start: '12:10', end: '12:50' },
	{ start: '13:20', end: '14:00' },
	{ start: '14:00', end: '14:40' },
	{ start: '14:40', end: '15:20' },
	{ start: '15:20', end: '16:00' },
];

/** Matches the calendar min hour from {@link getLessonDayBounds}. */
export function getCalendarVisibleStartTime(): string {
	const firstRaw = timeTable[0]?.start ?? '08:00';
	const firstHour = Number.parseInt(firstRaw.split(':')[0], 10);
	return `${String(firstHour).padStart(2, '0')}:00`;
}

/** Selectable slots before the first regular lesson hour (e.g. 08:00–08:30). */
export function getPreSchoolTimeTable(): TimeSlot[] {
	const visibleStart = getCalendarVisibleStartTime();
	const schoolStart = timeTable[0]?.start;
	if (!schoolStart || visibleStart >= schoolStart) return [];
	return [{ start: visibleStart, end: schoolStart }];
}

/** All slots that can be selected in the agenda (pre-school + regular lessons). */
export function getSelectableTimeTable(): TimeSlot[] {
	return [...getPreSchoolTimeTable(), ...timeTable];
}

export function getBreakPeriods(): BreakPeriod[] {
	const breaks: BreakPeriod[] = [];

	for (let index = 0; index < timeTable.length - 1; index++) {
		const current = timeTable[index];
		const next = timeTable[index + 1];
		if (current.end < next.start) {
			breaks.push({ start: current.end, end: next.start });
		}
	}

	return breaks;
}

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

	if (time < first.start) return { status: 'before-school' };
	if (time >= last.end) return { status: 'after-school' };

	for (let i = 0; i < timeTable.length; i++) {
		const slot = timeTable[i];
		const next = timeTable[i + 1];

		if (slot.start <= time && time < slot.end) {
			return {
				status: 'lesson',
				lesson: i + 1,
				range: `${slot.start}-${slot.end}`,
			};
		}

		if (next && slot.end <= time && time < next.start) {
			return {
				status: 'break',
				lesson: i + 1,
				range: `${slot.end}-${next.start}`,
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
		return { status: 'lesson', lesson: 1, range: `${slot.start}-${slot.end}` };
	}

	if (current.status === 'after-school') {
		return current;
	}

	const next = (current.lesson ?? 0) + 1;

	if (next > timeTable.length) {
		return { status: 'after-school' };
	}

	const slot = timeTable[next - 1];
	return { status: 'lesson', lesson: next, range: `${slot.start}-${slot.end}` };
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
