import type { EventProps } from 'react-big-calendar';
import { type CalendarEvent, isBreakCalendarEvent, isDraftCalendarEvent } from '@/lib/agendaCalendarUtils';
import { isSameAgendaEntryOccurrence } from '@/lib/agendaEntryUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import AgendaBreakBand from './AgendaBreakBand';
import AgendaEvent from './AgendaEvent';
import AgendaSlotGhost from './AgendaSlotGhost';
import DraftAgendaEvent from './DraftAgendaEvent';

export interface AgendaCalendarEventProps extends EventProps<CalendarEvent> {
	activeEntry?: AgendaEntry | null;
	overlappingEventIds: Set<string>;
}

export default function AgendaCalendarEvent({ event, activeEntry, overlappingEventIds }: AgendaCalendarEventProps) {
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
