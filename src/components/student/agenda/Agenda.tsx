'use client';

import { type CSSProperties, memo, useMemo } from 'react';
import { AgendaCalendar } from '@/components/student/agenda/AgendaCalendar';
import { type AgendaProps, agendaPropsEqual } from '@/components/student/agenda/agendaProps';
import { useAgendaCalendar } from '@/hooks/agenda/useAgendaCalendar';
import { buildLessonGridGradient, getLessonGridLinePercents } from '@/lib/agenda/lessonHours';
import { cn } from '@/lib/utils';

function Agenda({
	entries,
	date,
	view,
	activeEntry,
	onSelectEntry,
	onSelectSlot,
	draftSelection,
	draftLabel,
	selectionMode,
	highlightDateKey,
	focusReturnMeasureId,
	transformSelection,
}: AgendaProps) {
	const calendar = useAgendaCalendar(entries, date, view, activeEntry, onSelectEntry, {
		draftSelection,
		draftLabel,
		onSelectSlot,
		selectionMode,
		highlightDateKey,
		focusReturnMeasureId,
		transformSelection,
	});

	const lessonGridStyle = useMemo((): CSSProperties => {
		const percents = getLessonGridLinePercents(calendar.min, calendar.max);
		return { '--agenda-lesson-grid': buildLessonGridGradient(percents) } as CSSProperties;
	}, [calendar.min, calendar.max]);

	const weekFullDayShortcut = view === 'work_week' && calendar.slotSelectionEnabled;

	return (
		<div
			className={cn(
				'agenda-lesson-grid h-full overflow-hidden',
				weekFullDayShortcut && 'agenda-week-full-day-shortcut',
				calendar.createMode && 'agenda-create-mode',
				calendar.rescheduleMode && 'agenda-reschedule-mode',
			)}
			style={lessonGridStyle}
		>
			<AgendaCalendar date={date} view={view} calendar={calendar} />
		</div>
	);
}

export default memo(Agenda, agendaPropsEqual);
