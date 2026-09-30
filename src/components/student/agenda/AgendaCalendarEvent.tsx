import { memo } from 'react';
import type { EventProps } from 'react-big-calendar';
import AgendaBreakBand from '@/components/student/agenda/AgendaBreakBand';
import AgendaEvent from '@/components/student/agenda/AgendaEvent';
import AgendaSlotGhost from '@/components/student/agenda/AgendaSlotGhost';
import DraftAgendaEvent from '@/components/student/agenda/DraftAgendaEvent';
import { type CalendarEvent, isBreakCalendarEvent, isDraftCalendarEvent } from '@/lib/agenda/calendarUtils';
import { isSameAgendaEntryOccurrence } from '@/lib/agenda/entryUtils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

export interface AgendaCalendarEventProps extends EventProps<CalendarEvent> {
	activeEntry?: AgendaEntry | null;
	overlappingEventIds: Set<string>;
}

function AgendaCalendarEvent({ event, activeEntry, overlappingEventIds }: AgendaCalendarEventProps) {
	if (isBreakCalendarEvent(event)) {
		return <AgendaBreakBand start={event.start} end={event.end} />;
	}

	if (event.isHoverSlot) {
		return <AgendaSlotGhost variant="hover" selection={event} />;
	}

	if (isDraftCalendarEvent(event)) {
		return <DraftAgendaEvent event={event} />;
	}

	if (!event.resource) return null;

	return (
		<AgendaEvent
			entry={event.resource}
			isActive={isSameAgendaEntryOccurrence(event.resource, activeEntry)}
			isCompact={overlappingEventIds.has(event.id)}
		/>
	);
}

export default memo(
	AgendaCalendarEvent,
	(prev, next) =>
		prev.event === next.event &&
		prev.activeEntry === next.activeEntry &&
		prev.overlappingEventIds === next.overlappingEventIds,
);
