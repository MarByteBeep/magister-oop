import { createElement, useCallback, useMemo } from 'react';
import type { EventProps, View } from 'react-big-calendar';
import AgendaCalendarEvent from '@/components/student/AgendaCalendarEvent';
import AgendaCalendarHeader from '@/components/student/AgendaCalendarHeader';
import { firstLessonTime, lastLessonTime } from '@/components/student/agendaCalendarConfig';
import {
	agendaItemsToCalendarEvents,
	type CalendarEvent,
	getOverlappingEventIds,
	isSameCalendarDay,
} from '@/lib/agendaCalendarUtils';
import { hhmmToDate } from '@/lib/bigCalendarUtils';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/magister/response/agenda.types';

export function useAgendaCalendar(
	items: AgendaItem[],
	date: Date,
	view: View,
	activeItemId: number | null | undefined,
	onSelectItem: (item: AgendaItem) => void,
) {
	const events = useMemo(() => agendaItemsToCalendarEvents(items), [items]);
	const overlappingEventIds = useMemo(() => getOverlappingEventIds(events), [events]);
	const min = useMemo(() => hhmmToDate(date, firstLessonTime), [date]);
	const max = useMemo(() => hhmmToDate(date, lastLessonTime), [date]);

	const handleSelectEvent = useCallback((ev: CalendarEvent) => onSelectItem(ev.resource), [onSelectItem]);
	const dayPropGetter = useCallback(
		(d: Date) => ({ className: cn(isSameCalendarDay(d, new Date()) && 'agenda-today-column') }),
		[],
	);
	const tooltipAccessor = useCallback(() => '', []);

	const components = useMemo(
		() => ({
			header: AgendaCalendarHeader,
			event: (props: EventProps<CalendarEvent>) =>
				createElement(AgendaCalendarEvent, { ...props, activeItemId, overlappingEventIds }),
		}),
		[activeItemId, overlappingEventIds],
	);

	const views: View[] = view === 'work_week' ? ['work_week'] : ['day'];

	return { events, min, max, handleSelectEvent, dayPropGetter, tooltipAccessor, components, views };
}
