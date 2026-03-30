import { formatTime, getNow } from '@/lib/dateUtils';
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
	const locations =
		item.locaties.length > 0
			? item.locaties
					.map((e) => e.code?.toLowerCase() ?? e.omschrijving)
					.filter(Boolean)
					.join(', ')
			: undefined;

	const courseCodes =
		item.vakken.length > 0
			? item.vakken
					.map((e) => e.code)
					.filter(Boolean)
					.join(', ')
			: undefined;

	const filteredTeachers = item.deelnames.filter((e) => e.type === 'medewerker');

	const teachers =
		filteredTeachers.length > 0
			? filteredTeachers.map((e) => `${e.roepnaam} ${e.tussenvoegsel ?? ''} ${e.achternaam}`).join(', ')
			: undefined;

	const teachersCodes = filteredTeachers.length > 0 ? filteredTeachers.map((e) => `${e.code}`).join(', ') : undefined;

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
	};
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

export function findAgendaItem(date: Date, agendaItems: AgendaItem[]) {
	for (const item of agendaItems) {
		const beginTime = new Date(item.begin);
		const endTime = new Date(item.einde);
		if (date >= beginTime && date < endTime) {
			return item;
		}
	}
	return null;
}

export function findNextAgendaItem(date: Date, agendaItems: AgendaItem[]) {
	// Filter out items that have already started or ended, and only consider items that START in the future.
	const futureItems = agendaItems.filter((item) => new Date(item.begin) > date);
	// Sort by start time to find the earliest upcoming item
	futureItems.sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime());
	return futureItems.length > 0 ? futureItems[0] : null;
}

/** Same overlap rule as occupancy; lessonRange format "HH:MM-HH:MM" (e.g. from getLesson / timeTable). */
export function findAgendaItemOverlappingLessonRange(
	agendaItems: AgendaItem[],
	lessonRange: string,
): AgendaItem | null {
	const [lessonStart, lessonEnd] = lessonRange.split('-').map((s) => s.trim());
	if (!lessonStart || !lessonEnd) return null;

	for (const item of agendaItems) {
		const itemStart = new Date(item.begin);
		const itemEnd = new Date(item.einde);
		const itemStartTime = `${String(itemStart.getHours()).padStart(2, '0')}:${String(itemStart.getMinutes()).padStart(2, '0')}`;
		const itemEndTime = `${String(itemEnd.getHours()).padStart(2, '0')}:${String(itemEnd.getMinutes()).padStart(2, '0')}`;

		const overlaps =
			(itemStartTime < lessonEnd && itemEndTime > lessonStart) ||
			(itemStartTime === lessonStart && itemEndTime === lessonEnd);

		if (overlaps) return item;
	}
	return null;
}

export function findCurrentAgendaItem(agendaItems: AgendaItem[]) {
	return findAgendaItem(getNow(), agendaItems);
}
