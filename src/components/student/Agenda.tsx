'use client';

import { Calendar, type View } from 'react-big-calendar';
import { useAgendaCalendar } from '@/hooks/useAgendaCalendar';
import type { AgendaItem } from '@/magister/response/agenda.types';
import { agendaCalendarFormats, agendaCalendarMessages, agendaLocalizer } from './agendaCalendarConfig';

export interface AgendaProps {
	items: AgendaItem[];
	date: Date;
	view: View;
	activeItem?: AgendaItem | null;
	onSelectItem: (item: AgendaItem) => void;
}

export default function Agenda({ items, date, view, activeItem, onSelectItem }: AgendaProps) {
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
	} = useAgendaCalendar(items, date, view, activeItem, onSelectItem);

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
