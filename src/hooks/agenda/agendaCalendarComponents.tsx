import { createElement, type ReactElement, type ReactNode } from 'react';
import type { EventProps } from 'react-big-calendar';
import AgendaCalendarEvent from '@/components/student/agenda/AgendaCalendarEvent';
import AgendaCalendarHeader from '@/components/student/agenda/AgendaCalendarHeader';
import AgendaFullDayShortcutCellWrapper from '@/components/student/agenda/AgendaFullDayShortcutCellWrapper';
import type { CalendarEvent } from '@/lib/agenda/calendarUtils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

export function buildAgendaCalendarComponents(input: {
	fullDayShortcutEnabled: boolean;
	showFullDayCreateTooltip: boolean;
	handleSelectFullDay: (day: Date) => void;
	highlightDateKey?: string | null;
	stableActiveEntry: AgendaEntry | null | undefined;
	overlappingEventIds: Set<string>;
	onSelectEntry: (entry: AgendaEntry) => void;
	ghostReturnMeasure?: boolean;
	focusReturnMeasureId?: number | null;
}) {
	return {
		header: (props: { date: Date; label: string }): ReactElement =>
			createElement(AgendaCalendarHeader, {
				...props,
				onSelectFullDay: input.fullDayShortcutEnabled ? input.handleSelectFullDay : undefined,
				showCreateTooltip: input.showFullDayCreateTooltip,
				highlightDateKey: input.highlightDateKey,
			}),
		dateCellWrapper: input.fullDayShortcutEnabled
			? (wrapperProps: { value: Date; range: Date[]; children: ReactNode }): ReactElement =>
					createElement(AgendaFullDayShortcutCellWrapper, {
						...wrapperProps,
						showCreateTooltip: input.showFullDayCreateTooltip,
					})
			: undefined,
		event: (props: EventProps<CalendarEvent>): ReactElement =>
			createElement(AgendaCalendarEvent, {
				...props,
				activeEntry: input.stableActiveEntry,
				overlappingEventIds: input.overlappingEventIds,
				onSelectRegistration: input.onSelectEntry,
				ghostReturnMeasure: input.ghostReturnMeasure,
				focusReturnMeasureId: input.focusReturnMeasureId,
			}),
	};
}
