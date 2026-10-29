import { memo, type ReactNode } from 'react';
import type { EventProps } from 'react-big-calendar';
import AgendaBreakBand from '@/components/student/agenda/calendar/AgendaBreakBand';
import AgendaEvent from '@/components/student/agenda/calendar/AgendaEvent';
import AgendaSlotGhost from '@/components/student/agenda/calendar/AgendaSlotGhost';
import DraftAgendaEvent from '@/components/student/agenda/calendar/DraftAgendaEvent';
import type { CalendarEvent } from '@/lib/agenda/calendarUtils';
import { isBreakCalendarEvent, isDraftCalendarEvent } from '@/lib/agenda/calendarUtils';
import { isSameAgendaEntryOccurrence } from '@/lib/agenda/entryUtils';
import type { AgendaEntry, RegistrationAgendaEntry } from '@/magister/response/agendaEntry.types';

export interface AgendaCalendarEventProps extends EventProps<CalendarEvent> {
	activeEntry?: AgendaEntry | null;
	overlappingEventIds: Set<string>;
	onSelectRegistration?: (entry: RegistrationAgendaEntry) => void;
}

function sameOverlappingIds(prev: AgendaCalendarEventProps, next: AgendaCalendarEventProps): boolean {
	return prev.overlappingEventIds === next.overlappingEventIds;
}

function sameHandlers(prev: AgendaCalendarEventProps, next: AgendaCalendarEventProps): boolean {
	if (prev.onSelectRegistration !== next.onSelectRegistration) return false;
	return sameOverlappingIds(prev, next);
}

function sameActive(prev: AgendaCalendarEventProps, next: AgendaCalendarEventProps): boolean {
	if (prev.activeEntry !== next.activeEntry) return false;
	return sameHandlers(prev, next);
}

function agendaCalendarEventPropsEqual(prev: AgendaCalendarEventProps, next: AgendaCalendarEventProps): boolean {
	if (prev.event !== next.event) return false;
	return sameActive(prev, next);
}

function renderResourceEvent({
	event,
	activeEntry,
	overlappingEventIds,
	onSelectRegistration,
}: AgendaCalendarEventProps): ReactNode {
	if (!event.resource) return null;

	return (
		<AgendaEvent
			entry={event.resource}
			registrations={event.registrations}
			onSelectRegistration={onSelectRegistration}
			isActive={isSameAgendaEntryOccurrence(event.resource, activeEntry)}
			isCompact={overlappingEventIds.has(event.id)}
		/>
	);
}

function renderDraftOrResource(props: AgendaCalendarEventProps): ReactNode {
	if (isDraftCalendarEvent(props.event)) return <DraftAgendaEvent event={props.event} />;
	return renderResourceEvent(props);
}

function renderHoverOrSettled(props: AgendaCalendarEventProps): ReactNode {
	if (props.event.isHoverSlot) return <AgendaSlotGhost variant="hover" selection={props.event} />;
	return renderDraftOrResource(props);
}

function AgendaCalendarEvent(props: AgendaCalendarEventProps) {
	if (isBreakCalendarEvent(props.event)) {
		return <AgendaBreakBand start={props.event.start} end={props.event.end} />;
	}
	return renderHoverOrSettled(props);
}

export default memo(AgendaCalendarEvent, agendaCalendarEventPropsEqual);
