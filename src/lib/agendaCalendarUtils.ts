import { getAgendaItemInfo } from '@/lib/agendaUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';

export type CalendarEvent = {
	id: number;
	title: string;
	start: Date;
	end: Date;
	resource: AgendaItem;
};

export function isSameCalendarDay(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function agendaItemsToCalendarEvents(items: AgendaItem[]): CalendarEvent[] {
	return items.map((item) => {
		const { courseDescriptions, subject } = getAgendaItemInfo(item);
		return {
			id: item.id,
			title: courseDescriptions ?? subject ?? 'Les',
			start: new Date(item.begin),
			end: new Date(item.einde),
			resource: item,
		};
	});
}

export function getOverlappingEventIds(events: CalendarEvent[]): Set<number> {
	const overlappingIds = new Set<number>();

	for (let i = 0; i < events.length; i++) {
		for (let j = i + 1; j < events.length; j++) {
			const a = events[i];
			const b = events[j];
			if (!a || !b) continue;

			const sameDay = isSameCalendarDay(a.start, b.start);
			const overlaps = a.start < b.end && a.end > b.start;

			if (sameDay && overlaps) {
				overlappingIds.add(a.id);
				overlappingIds.add(b.id);
			}
		}
	}

	return overlappingIds;
}
