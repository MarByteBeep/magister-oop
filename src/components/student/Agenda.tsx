'use client';

import { Calendar, type View } from 'react-big-calendar';
import { useAgendaCalendar } from '@/hooks/useAgendaCalendar';
import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import { agendaCalendarFormats, agendaCalendarMessages, agendaLocalizer } from './agendaCalendarConfig';

export interface AgendaProps {
	entries: AgendaEntry[];
	date: Date;
	view: View;
	activeEntry?: AgendaEntry | null;
	onSelectEntry: (entry: AgendaEntry) => void;
	onSelectSlot?: (selection: AgendaSlotSelection) => void;
	draftSelection?: AgendaSlotSelection | null;
}

export default function Agenda({
	entries,
	date,
	view,
	activeEntry,
	onSelectEntry,
	onSelectSlot,
	draftSelection,
}: AgendaProps) {
	const {
		events,
		backgroundEvents,
		min,
		max,
		handleSelectEvent,
		handleSelecting,
		handleSelectSlot,
		slotSelectionEnabled,
		dayPropGetter,
		slotPropGetter,
		eventPropGetter,
		tooltipAccessor,
		components,
		views,
		dayLayoutAlgorithm,
	} = useAgendaCalendar(entries, date, view, activeEntry, onSelectEntry, { draftSelection, onSelectSlot });

	return (
		<div className="h-full overflow-hidden">
			<Calendar
				localizer={agendaLocalizer}
				culture="nl"
				messages={agendaCalendarMessages}
				events={events}
				date={date}
				view={view}
				views={views}
				toolbar={false}
				selectable={slotSelectionEnabled ? 'ignoreEvents' : false}
				popup={false}
				dayLayoutAlgorithm={dayLayoutAlgorithm}
				step={15}
				timeslots={4}
				min={min}
				max={max}
				backgroundEvents={backgroundEvents}
				onSelectEvent={handleSelectEvent}
				onSelecting={slotSelectionEnabled ? handleSelecting : undefined}
				onSelectSlot={slotSelectionEnabled ? handleSelectSlot : undefined}
				tooltipAccessor={tooltipAccessor}
				dayPropGetter={dayPropGetter}
				slotPropGetter={slotSelectionEnabled ? slotPropGetter : undefined}
				eventPropGetter={eventPropGetter}
				components={components}
				formats={agendaCalendarFormats}
				className="text-sm"
			/>
		</div>
	);
}
