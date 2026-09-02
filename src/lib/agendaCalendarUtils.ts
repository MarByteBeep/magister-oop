import { getAgendaItemInfo, getAgendaOccurrenceKey } from '@/lib/agendaUtils';
import { getReturnMeasureDisplay, isReturnMeasureAgendaItem } from '@/lib/returnMeasureUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';

export type CalendarEvent = {
	id: string;
	title: string;
	start: Date;
	end: Date;
	resource: AgendaItem;
};

export function isSameCalendarDay(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function agendaItemToCalendarEvent(item: AgendaItem): CalendarEvent {
	const { courseDescriptions, subject } = getAgendaItemInfo(item);
	const title = isReturnMeasureAgendaItem(item)
		? getReturnMeasureDisplay(item).primaryLabel
		: (courseDescriptions ?? subject ?? 'Les');
	return {
		id: getAgendaOccurrenceKey(item),
		title,
		start: new Date(item.begin),
		end: new Date(item.einde),
		resource: item,
	};
}

export function agendaItemsToCalendarEvents(items: AgendaItem[]): CalendarEvent[] {
	return items.map(agendaItemToCalendarEvent);
}

/** Overlap packing for compact lesson UI; return measures are ignored (they render full-width behind). */
export function getOverlappingEventIds(events: CalendarEvent[]): Set<string> {
	const overlappingIds = new Set<string>();
	const lessonEvents = events.filter((event) => !isReturnMeasureAgendaItem(event.resource));

	for (let i = 0; i < lessonEvents.length; i++) {
		for (let j = i + 1; j < lessonEvents.length; j++) {
			const a = lessonEvents[i];
			const b = lessonEvents[j];
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
