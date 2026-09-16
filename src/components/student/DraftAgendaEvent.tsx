import type { CalendarEvent } from '@/lib/agendaCalendarUtils';
import AgendaSlotGhost from './AgendaSlotGhost';

interface DraftAgendaEventProps {
	event: CalendarEvent;
}

export default function DraftAgendaEvent({ event }: DraftAgendaEventProps) {
	return <AgendaSlotGhost variant="draft" selection={event} />;
}
