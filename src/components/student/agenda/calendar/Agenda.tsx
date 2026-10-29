'use client';

import { type CSSProperties, memo, useMemo } from 'react';
import type { View } from 'react-big-calendar';
import AgendaCalendarView from '@/components/student/agenda/calendar/AgendaCalendarView';
import { useAgendaCalendar } from '@/hooks/agenda/useAgendaCalendar';
import { agendaEntriesEqual, isSameAgendaEntryOccurrence } from '@/lib/agenda/entryUtils';
import { buildLessonGridGradient, getLessonGridLinePercents } from '@/lib/agenda/lessonHours';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { cn } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

interface AgendaProps {
	entries: AgendaEntry[];
	date: Date;
	view: View;
	activeEntry?: AgendaEntry | null;
	onSelectEntry: (entry: AgendaEntry) => void;
	onSelectSlot?: (selection: AgendaSlotSelection) => void;
	draftSelection?: AgendaSlotSelection | null;
}

function buildAgendaLessonGridStyle(min: Date, max: Date): CSSProperties {
	const percents = getLessonGridLinePercents(min, max);
	return {
		'--agenda-lesson-grid': buildLessonGridGradient(percents),
	} as CSSProperties;
}

function weekShortcutClass(view: View, slotSelectionEnabled: boolean): string | undefined {
	if (view !== 'work_week') return undefined;
	if (!slotSelectionEnabled) return undefined;
	return 'agenda-week-full-day-shortcut';
}

function createModeClass(createMode: boolean): string | undefined {
	if (!createMode) return undefined;
	return 'agenda-create-mode';
}

function agendaShellClassName(view: View, slotSelectionEnabled: boolean, createMode: boolean): string {
	return cn(
		'agenda-lesson-grid h-full overflow-hidden',
		weekShortcutClass(view, slotSelectionEnabled),
		createModeClass(createMode),
	);
}

function sameAgendaDate(prev: Date, next: Date): boolean {
	return prev.getTime() === next.getTime();
}

function sameAgendaHandlers(prev: AgendaProps, next: AgendaProps): boolean {
	if (prev.onSelectSlot !== next.onSelectSlot) return false;
	return prev.onSelectEntry === next.onSelectEntry;
}

function sameAgendaViewState(prev: AgendaProps, next: AgendaProps): boolean {
	if (prev.view !== next.view) return false;
	return prev.draftSelection === next.draftSelection;
}

function sameActiveEntry(prev: AgendaEntry | null | undefined, next: AgendaEntry | null | undefined): boolean {
	if (prev === next) return true;
	return isSameAgendaEntryOccurrence(prev, next);
}

function sameAgendaEntriesAndActive(prev: AgendaProps, next: AgendaProps): boolean {
	if (!agendaEntriesEqual(prev.entries, next.entries)) return false;
	return sameActiveEntry(prev.activeEntry, next.activeEntry);
}

function sameAgendaContent(prev: AgendaProps, next: AgendaProps): boolean {
	if (!sameAgendaDate(prev.date, next.date)) return false;
	return sameAgendaEntriesAndActive(prev, next);
}

function sameAgendaData(prev: AgendaProps, next: AgendaProps): boolean {
	if (!sameAgendaHandlers(prev, next)) return false;
	return sameAgendaContent(prev, next);
}

function agendaPropsEqual(prev: AgendaProps, next: AgendaProps): boolean {
	if (!sameAgendaViewState(prev, next)) return false;
	return sameAgendaData(prev, next);
}

function slotCreateEnabled(slotSelectionEnabled: boolean, createMode: boolean): boolean {
	if (!slotSelectionEnabled) return false;
	return createMode;
}

function Agenda({ entries, date, view, activeEntry, onSelectEntry, onSelectSlot, draftSelection }: AgendaProps) {
	const model = useAgendaCalendar(entries, date, view, activeEntry, onSelectEntry, {
		draftSelection,
		onSelectSlot,
	});

	const lessonGridStyle = useMemo(() => buildAgendaLessonGridStyle(model.min, model.max), [model.min, model.max]);

	return (
		<div
			className={agendaShellClassName(view, model.slotSelectionEnabled, model.createMode)}
			style={lessonGridStyle}
		>
			<AgendaCalendarView
				model={model}
				date={date}
				view={view}
				slotSelectionEnabled={model.slotSelectionEnabled}
				slotCreateEnabled={slotCreateEnabled(model.slotSelectionEnabled, model.createMode)}
			/>
		</div>
	);
}

export default memo(Agenda, agendaPropsEqual);
