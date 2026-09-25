import type { CalendarEvent } from '@/lib/agendaCalendarUtils';
import { isBackgroundOverlayCalendarEvent, isBreakCalendarEvent } from '@/lib/agendaCalendarUtils';
import { isAbsenceNoticeEntry, isReturnMeasureEntry } from '@/lib/agendaEntryUtils';
import { isFullDayReturnMeasureEntry, isFullDayScheduleSelection } from '@/lib/fullDayScheduleUtils';

export interface PartitionedAgendaEvents {
	lessons: CalendarEvent[];
	fullDayReturnMeasures: CalendarEvent[];
	gutterOverlays: CalendarEvent[];
	partialDraftEvents: CalendarEvent[];
	fullDayDraftEvents: CalendarEvent[];
	breakEvents: CalendarEvent[];
}

function classifyResourceEvent(event: CalendarEvent, buckets: PartitionedAgendaEvents): void {
	const resource = event.resource;
	if (!resource) return;

	if (isReturnMeasureEntry(resource)) {
		if (isFullDayReturnMeasureEntry(resource)) {
			buckets.fullDayReturnMeasures.push(event);
		} else {
			buckets.gutterOverlays.push(event);
		}
		return;
	}

	if (isAbsenceNoticeEntry(resource)) {
		buckets.gutterOverlays.push(event);
		return;
	}

	buckets.lessons.push(event);
}

export function partitionAgendaEvents(events: CalendarEvent[]): PartitionedAgendaEvents {
	const buckets: PartitionedAgendaEvents = {
		lessons: [],
		fullDayReturnMeasures: [],
		gutterOverlays: [],
		partialDraftEvents: [],
		fullDayDraftEvents: [],
		breakEvents: [],
	};

	for (const event of events) {
		if (isBackgroundOverlayCalendarEvent(event)) {
			if (event.isDraft && isFullDayScheduleSelection(event)) {
				buckets.fullDayDraftEvents.push(event);
			} else {
				buckets.partialDraftEvents.push(event);
			}
			continue;
		}

		if (isBreakCalendarEvent(event)) {
			buckets.breakEvents.push(event);
			continue;
		}

		classifyResourceEvent(event, buckets);
	}

	return buckets;
}
