'use client';

import { Calendar, type View } from 'react-big-calendar';
import { useAgendaCalendar } from '@/hooks/useAgendaCalendar';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import { agendaCalendarFormats, agendaCalendarMessages, agendaLocalizer } from './agendaCalendarConfig';

export interface AgendaProps {
	entries: AgendaEntry[];
	date: Date;
	view: View;
	activeEntry?: AgendaEntry | null;
	onSelectEntry: (entry: AgendaEntry) => void;
}

export default function Agenda({ entries, date, view, activeEntry, onSelectEntry }: AgendaProps) {
	const {
		events,
		min,
		max,
		handleSelectEvent,
		dayPropGetter,
		eventPropGetter,
		tooltipAccessor,
		components,
		views,
		dayLayoutAlgorithm,
	} = useAgendaCalendar(entries, date, view, activeEntry, onSelectEntry);

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
				selectable={false}
				popup={false}
				dayLayoutAlgorithm={dayLayoutAlgorithm}
				step={60}
				timeslots={1}
				min={min}
				max={max}
				onSelectEvent={handleSelectEvent}
				tooltipAccessor={tooltipAccessor}
				dayPropGetter={dayPropGetter}
				eventPropGetter={eventPropGetter}
				components={components}
				formats={agendaCalendarFormats}
				className="text-sm"
			/>
		</div>
	);
}
