'use client';

import { type CSSProperties, useMemo } from 'react';
import { Calendar, type View } from 'react-big-calendar';
import { useAgendaCalendar } from '@/hooks/useAgendaCalendar';
import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { buildLessonGridGradient, getLessonGridLinePercents } from '@/lib/lessonHours';
import { cn } from '@/lib/utils';
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

	const lessonGridStyle = useMemo((): CSSProperties => {
		const percents = getLessonGridLinePercents(min, max);
		return { '--agenda-lesson-grid': buildLessonGridGradient(percents) } as CSSProperties;
	}, [min, max]);

	const weekFullDayShortcut = view === 'work_week' && slotSelectionEnabled;

	return (
		<div
			className={cn(
				'agenda-lesson-grid h-full overflow-hidden',
				weekFullDayShortcut && 'agenda-week-full-day-shortcut',
			)}
			style={lessonGridStyle}
		>
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
