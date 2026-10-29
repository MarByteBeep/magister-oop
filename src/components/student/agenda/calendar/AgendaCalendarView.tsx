'use client';

import { Calendar, type View } from 'react-big-calendar';
import {
	agendaCalendarFormats,
	agendaCalendarMessages,
	agendaLocalizer,
} from '@/components/student/agenda/calendar/agendaCalendarConfig';
import type { useAgendaCalendar } from '@/hooks/agenda/useAgendaCalendar';

export type AgendaCalendarModel = ReturnType<typeof useAgendaCalendar>;

export interface AgendaCalendarViewProps {
	model: AgendaCalendarModel;
	date: Date;
	view: View;
	slotSelectionEnabled: boolean;
	slotCreateEnabled: boolean;
}

function selectableValue(slotCreateEnabled: boolean): 'ignoreEvents' | false {
	if (slotCreateEnabled) return 'ignoreEvents';
	return false;
}

function whenEnabled<T>(enabled: boolean, value: T): T | undefined {
	if (!enabled) return undefined;
	return value;
}

export default function AgendaCalendarView({
	model,
	date,
	view,
	slotSelectionEnabled,
	slotCreateEnabled,
}: AgendaCalendarViewProps) {
	return (
		<Calendar
			localizer={agendaLocalizer}
			culture="nl"
			messages={agendaCalendarMessages}
			events={model.events}
			date={date}
			view={view}
			views={model.views}
			toolbar={false}
			selectable={selectableValue(slotCreateEnabled)}
			popup={false}
			dayLayoutAlgorithm={model.dayLayoutAlgorithm}
			step={15}
			timeslots={4}
			min={model.min}
			max={model.max}
			backgroundEvents={model.backgroundEvents}
			onSelectEvent={model.handleSelectEvent}
			onSelecting={whenEnabled(slotSelectionEnabled, model.handleSelecting)}
			onSelectSlot={whenEnabled(slotSelectionEnabled, model.handleSelectSlot)}
			tooltipAccessor={model.tooltipAccessor}
			dayPropGetter={model.dayPropGetter}
			slotPropGetter={whenEnabled(slotSelectionEnabled, model.slotPropGetter)}
			eventPropGetter={model.eventPropGetter}
			components={model.components}
			formats={agendaCalendarFormats}
			className="text-sm"
		/>
	);
}
