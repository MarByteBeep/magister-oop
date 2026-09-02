import type { EventProps } from 'react-big-calendar';
import type { CalendarEvent } from '@/lib/agendaCalendarUtils';
import { isSameAgendaOccurrence } from '@/lib/agendaUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import AgendaEvent from './AgendaEvent';

export interface AgendaCalendarEventProps extends EventProps<CalendarEvent> {
	activeItem?: AgendaItem | null;
	overlappingEventIds: Set<string>;
}

export default function AgendaCalendarEvent({ event, activeItem, overlappingEventIds }: AgendaCalendarEventProps) {
	return (
		<AgendaEvent
			item={event.resource}
			isActive={isSameAgendaOccurrence(event.resource, activeItem)}
			isCompact={overlappingEventIds.has(event.id)}
		/>
	);
}
