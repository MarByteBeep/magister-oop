'use client';

import { type CSSProperties, memo, useMemo } from 'react';
import { Calendar, type View } from 'react-big-calendar';
import {
	agendaCalendarFormats,
	agendaCalendarMessages,
	agendaLocalizer,
} from '@/components/student/agenda/agendaCalendarConfig';
import { useAgendaCalendar } from '@/hooks/agenda/useAgendaCalendar';
import { agendaEntriesEqual, isSameAgendaEntryOccurrence } from '@/lib/agenda/entryUtils';
import { buildLessonGridGradient, getLessonGridLinePercents } from '@/lib/agenda/lessonHours';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { cn } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

export interface AgendaProps {
	entries: AgendaEntry[];
	date: Date;
	view: View;
	activeEntry?: AgendaEntry | null;
	onSelectEntry: (entry: AgendaEntry) => void;
	onSelectSlot?: (selection: AgendaSlotSelection) => void;
	draftSelection?: AgendaSlotSelection | null;
}

function agendaPropsEqual(prev: AgendaProps, next: AgendaProps): boolean {
	if (prev.view !== next.view || prev.draftSelection !== next.draftSelection) return false;
	if (prev.onSelectSlot !== next.onSelectSlot || prev.onSelectEntry !== next.onSelectEntry) return false;
	if (prev.date.getTime() !== next.date.getTime()) return false;
	if (!agendaEntriesEqual(prev.entries, next.entries)) return false;
	if (prev.activeEntry === next.activeEntry) return true;
	return isSameAgendaEntryOccurrence(prev.activeEntry, next.activeEntry);
}

function Agenda({ entries, date, view, activeEntry, onSelectEntry, onSelectSlot, draftSelection }: AgendaProps) {
	const {
		events,
		backgroundEvents,
		min,
		max,
		handleSelectEvent,
		handleSelecting,
		handleSelectSlot,
		createMode,
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
	const slotCreateEnabled = slotSelectionEnabled && createMode;

	return (
		<div
			className={cn(
				'agenda-lesson-grid h-full overflow-hidden',
				weekFullDayShortcut && 'agenda-week-full-day-shortcut',
				createMode && 'agenda-create-mode',
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
				selectable={slotCreateEnabled ? 'ignoreEvents' : false}
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

export default memo(Agenda, agendaPropsEqual);
