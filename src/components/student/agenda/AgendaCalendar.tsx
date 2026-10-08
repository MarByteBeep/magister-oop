'use client';

import { Calendar } from 'react-big-calendar';
import {
	agendaCalendarFormats,
	agendaCalendarMessages,
	agendaLocalizer,
} from '@/components/student/agenda/agendaCalendarConfig';
import type { useAgendaCalendar } from '@/hooks/agenda/useAgendaCalendar';

type AgendaCalendarModel = ReturnType<typeof useAgendaCalendar>;

interface AgendaCalendarProps {
	date: Date;
	view: AgendaCalendarModel['views'][number];
	calendar: AgendaCalendarModel;
}

export function AgendaCalendar({ date, view, calendar }: AgendaCalendarProps) {
	const slotCreateEnabled = calendar.slotSelectionEnabled && calendar.createMode;
	const selectingHandler = calendar.slotSelectionEnabled ? calendar.handleSelecting : undefined;
	const selectSlotHandler = calendar.slotSelectionEnabled ? calendar.handleSelectSlot : undefined;
	const slotPropGetter = calendar.slotSelectionEnabled ? calendar.slotPropGetter : undefined;

	return (
		<Calendar
			localizer={agendaLocalizer}
			culture="nl"
			messages={agendaCalendarMessages}
			events={calendar.events}
			date={date}
			view={view}
			views={calendar.views}
			toolbar={false}
			selectable={slotCreateEnabled ? 'ignoreEvents' : false}
			popup={false}
			dayLayoutAlgorithm={calendar.dayLayoutAlgorithm}
			step={15}
			timeslots={4}
			min={calendar.min}
			max={calendar.max}
			backgroundEvents={calendar.backgroundEvents}
			onSelectEvent={calendar.handleSelectEvent}
			onSelecting={selectingHandler}
			onSelectSlot={selectSlotHandler}
			tooltipAccessor={calendar.tooltipAccessor}
			dayPropGetter={calendar.dayPropGetter}
			slotPropGetter={slotPropGetter}
			eventPropGetter={calendar.eventPropGetter}
			components={calendar.components}
			formats={agendaCalendarFormats}
			className="text-sm"
		/>
	);
}
