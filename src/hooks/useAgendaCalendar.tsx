import { createElement, useCallback, useMemo } from 'react';
import type { EventProps, View } from 'react-big-calendar';
import AgendaCalendarEvent from '@/components/student/AgendaCalendarEvent';
import AgendaCalendarHeader from '@/components/student/AgendaCalendarHeader';
import { firstLessonTime, lastLessonTime } from '@/components/student/agendaCalendarConfig';
import {
	agendaEntriesToCalendarEvents,
	type CalendarEvent,
	getOverlappingEventIds,
	isSameCalendarDay,
} from '@/lib/agendaCalendarUtils';
import { agendaDayLayoutAlgorithm } from '@/lib/agendaDayLayout';
import { isAbsenceNoticeEntry, isReturnMeasureEntry } from '@/lib/agendaEntryUtils';
import { hhmmToDate } from '@/lib/bigCalendarUtils';
import { isFullDayReturnMeasureEntry } from '@/lib/fullDayScheduleUtils';
import { cn } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';

export function useAgendaCalendar(
	entries: AgendaEntry[],
	date: Date,
	view: View,
	activeEntry: AgendaEntry | null | undefined,
	onSelectEntry: (entry: AgendaEntry) => void,
) {
	const events = useMemo(() => agendaEntriesToCalendarEvents(entries), [entries]);
	const overlappingEventIds = useMemo(() => getOverlappingEventIds(events), [events]);
	const min = useMemo(() => hhmmToDate(date, firstLessonTime), [date]);
	const max = useMemo(() => hhmmToDate(date, lastLessonTime), [date]);

	const handleSelectEvent = useCallback((ev: CalendarEvent) => onSelectEntry(ev.resource), [onSelectEntry]);
	const dayPropGetter = useCallback(
		(d: Date) => ({ className: cn(isSameCalendarDay(d, new Date()) && 'agenda-today-column') }),
		[],
	);
	const tooltipAccessor = useCallback(() => '', []);
	const eventPropGetter = useCallback((event: CalendarEvent) => {
		if (isReturnMeasureEntry(event.resource)) {
			if (isFullDayReturnMeasureEntry(event.resource)) {
				return {
					className: 'agenda-return-measure-event',
					style: { zIndex: 1 },
				};
			}
			return {
				className: 'agenda-return-measure-gutter-event',
				style: { zIndex: 2 },
			};
		}
		if (isAbsenceNoticeEntry(event.resource)) {
			return {
				className: 'agenda-absence-notice-event',
				style: { zIndex: 2 },
			};
		}
		return {
			className: 'agenda-lesson-event',
			style: { zIndex: 2 },
		};
	}, []);

	const components = useMemo(
		() => ({
			header: AgendaCalendarHeader,
			event: (props: EventProps<CalendarEvent>) =>
				createElement(AgendaCalendarEvent, { ...props, activeEntry, overlappingEventIds }),
		}),
		[activeEntry, overlappingEventIds],
	);

	const views: View[] = view === 'work_week' ? ['work_week'] : ['day'];

	return {
		events,
		min,
		max,
		handleSelectEvent,
		dayPropGetter,
		eventPropGetter,
		tooltipAccessor,
		components,
		views,
		dayLayoutAlgorithm: agendaDayLayoutAlgorithm,
	};
}
