import AgendaSlotGhost from '@/components/student/agenda/calendar/AgendaSlotGhost';
import type { CalendarEvent } from '@/lib/agenda/calendarUtils';

export interface DraftAgendaEventProps {
	event: CalendarEvent;
}

export default function DraftAgendaEvent({ event }: DraftAgendaEventProps) {
	return <AgendaSlotGhost variant="draft" selection={event} />;
}
