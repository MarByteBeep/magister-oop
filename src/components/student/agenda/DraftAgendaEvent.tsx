import { useState } from 'react';
import AgendaSlotGhost from '@/components/student/agenda/AgendaSlotGhost';
import type { CalendarEvent } from '@/lib/agenda/calendarUtils';
import { claimDraftAppear, draftAppearKey } from '@/lib/agenda/draftAppear';

interface DraftAgendaEventProps {
	event: CalendarEvent;
}

export default function DraftAgendaEvent({ event }: DraftAgendaEventProps) {
	const selection = { start: event.start, end: event.end, title: event.title };
	const [playAppear] = useState(() => claimDraftAppear(draftAppearKey(selection)));

	return <AgendaSlotGhost variant="draft" selection={selection} playAppear={playAppear} />;
}
