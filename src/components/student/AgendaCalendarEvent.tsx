import type { EventProps } from 'react-big-calendar';
import type { CalendarEvent } from '@/lib/agendaCalendarUtils';
import { isSameAgendaEntryOccurrence } from '@/lib/agendaEntryUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import AgendaEvent from './AgendaEvent';

export interface AgendaCalendarEventProps extends EventProps<CalendarEvent> {
	activeEntry?: AgendaEntry | null;
	overlappingEventIds: Set<string>;
}

export default function AgendaCalendarEvent({ event, activeEntry, overlappingEventIds }: AgendaCalendarEventProps) {
	return (
		<AgendaEvent
			entry={event.resource}
			isActive={isSameAgendaEntryOccurrence(event.resource, activeEntry)}
			isCompact={overlappingEventIds.has(event.id)}
		/>
	);
}
