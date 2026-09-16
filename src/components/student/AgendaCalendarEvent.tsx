import type { EventProps } from 'react-big-calendar';
import { type CalendarEvent, isDraftCalendarEvent } from '@/lib/agendaCalendarUtils';
import { isSameAgendaEntryOccurrence } from '@/lib/agendaEntryUtils';
import { getOverlappingLessonHoursForSelection } from '@/lib/lessonHours';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import AgendaEvent from './AgendaEvent';
import AgendaSlotGhost from './AgendaSlotGhost';
import DraftAgendaEvent from './DraftAgendaEvent';

export interface AgendaCalendarEventProps extends EventProps<CalendarEvent> {
	activeEntry?: AgendaEntry | null;
	overlappingEventIds: Set<string>;
}

export default function AgendaCalendarEvent({ event, activeEntry, overlappingEventIds }: AgendaCalendarEventProps) {
	if (event.isHoverSlot) {
		const lessonHour = getOverlappingLessonHoursForSelection(event)[0];
		return <AgendaSlotGhost variant="hover" lessonHour={lessonHour} />;
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
