import AgendaSlotGhost from '@/components/student/agenda/AgendaSlotGhost';
import type { CalendarEvent } from '@/lib/agenda/calendarUtils';

interface DraftAgendaEventProps {
	event: CalendarEvent;
}

export default function DraftAgendaEvent({ event }: DraftAgendaEventProps) {
	return <AgendaSlotGhost variant="draft" selection={event} />;
}
