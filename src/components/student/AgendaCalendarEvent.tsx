import type { EventProps } from 'react-big-calendar';
import type { CalendarEvent } from '@/lib/agendaCalendarUtils';
import AgendaEvent from './AgendaEvent';

export interface AgendaCalendarEventProps extends EventProps<CalendarEvent> {
	activeItemId?: number | null;
	overlappingEventIds: Set<number>;
}

export default function AgendaCalendarEvent({ event, activeItemId, overlappingEventIds }: AgendaCalendarEventProps) {
	return (
		<AgendaEvent
			item={event.resource}
			isActive={activeItemId != null && event.resource.id === activeItemId}
			isCompact={overlappingEventIds.has(event.id)}
		/>
	);
}
