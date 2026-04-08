'use client';

import { format, getDay, parse, startOfWeek } from 'date-fns';
import { nl } from 'date-fns/locale/nl';
import { useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, type EventProps, type Formats, type View } from 'react-big-calendar';
import { getAgendaItemInfo } from '@/lib/agendaUtils';
import { getLessonDayBounds, hhmmToDate } from '@/lib/bigCalendarUtils';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import AgendaEvent from './AgendaEvent.tsx';

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
	getDay,
	locales: { nl },
});

type CalendarEvent = {
	id: number;
	title: string;
	start: Date;
	end: Date;
	resource: AgendaItem;
};

interface AgendaHeaderProps {
	date: Date;
	label: string;
}

const { firstLessonTime, lastLessonTime } = getLessonDayBounds();
const calendarMessages = {
	today: 'Vandaag',
	previous: 'Vorige',
	next: 'Volgende',
	month: 'Maand',
	week: 'Week',
	work_week: 'Week',
	day: 'Dag',
	agenda: 'Agenda',
	date: 'Datum',
	time: 'Tijd',
	event: 'Les',
	noEventsInRange: 'Geen lessen in deze periode.',
	showMore: (total: number) => `+${total} meer`,
} as const;

export interface AgendaProps {
	items: AgendaItem[];
	date: Date;
	view: View;
	activeItemId?: number | null;
	onSelectItem: (item: AgendaItem) => void;
}

export default function Agenda({ items, date, view, activeItemId, onSelectItem }: AgendaProps) {
	const events = useMemo<CalendarEvent[]>(() => {
		return items.map((item) => {
			const { courseDescriptions, subject } = getAgendaItemInfo(item);
			return {
				id: item.id,
				title: courseDescriptions ?? subject ?? 'Les',
				start: new Date(item.begin),
				end: new Date(item.einde),
				resource: item,
			};
		});
	}, [items]);
	const overlappingEventIds = useMemo(() => {
		const overlappingIds = new Set<number>();

		for (let i = 0; i < events.length; i++) {
			for (let j = i + 1; j < events.length; j++) {
				const a = events[i];
				const b = events[j];
				if (!a || !b) continue;

				const sameDay =
					a.start.getFullYear() === b.start.getFullYear() &&
					a.start.getMonth() === b.start.getMonth() &&
					a.start.getDate() === b.start.getDate();
				const overlaps = a.start < b.end && a.end > b.start;

				if (sameDay && overlaps) {
					overlappingIds.add(a.id);
					overlappingIds.add(b.id);
				}
			}
		}

		return overlappingIds;
	}, [events]);

	const min = useMemo(() => hhmmToDate(date, firstLessonTime), [date]);
	const max = useMemo(() => hhmmToDate(date, lastLessonTime), [date]);

	const formats = useMemo<Partial<Formats>>(
		() => ({
			dayFormat: (d: Date, _culture, loc) => loc?.format(d, 'EEE d', 'nl') ?? format(d, 'EEE d', { locale: nl }),
			timeGutterFormat: (d: Date, _culture, loc) =>
				loc?.format(d, 'HH:mm', 'nl') ?? format(d, 'HH:mm', { locale: nl }),
		}),
		[],
	);
	const handleSelectEvent = useCallback(
		(ev: CalendarEvent) => {
			onSelectItem(ev.resource);
		},
		[onSelectItem],
	);
	const dayPropGetter = useCallback((d: Date) => {
		const isToday =
			d.getFullYear() === new Date().getFullYear() &&
			d.getMonth() === new Date().getMonth() &&
			d.getDate() === new Date().getDate();
		return {
			className: cn(isToday && 'agenda-today-column'),
		};
	}, []);
	const tooltipAccessor = useCallback(() => '', []);
	const components = useMemo(
		() => ({
			header: ({ date: headerDate, label }: AgendaHeaderProps) => {
				const isToday =
					headerDate.getFullYear() === new Date().getFullYear() &&
					headerDate.getMonth() === new Date().getMonth() &&
					headerDate.getDate() === new Date().getDate();

				return <div className={cn('h-full w-full', isToday && 'agenda-today-header')}>{label}</div>;
			},
			event: ({ event }: EventProps<CalendarEvent>) => (
				<AgendaEvent
					item={event.resource}
					isActive={activeItemId != null && event.resource.id === activeItemId}
					isCompact={overlappingEventIds.has(event.id)}
				/>
			),
		}),
		[activeItemId, overlappingEventIds],
	);

	return (
		<div className="h-full overflow-hidden">
			<Calendar
				localizer={localizer}
				culture="nl"
				messages={calendarMessages}
				events={events}
				date={date}
				view={view}
				views={view === 'work_week' ? (['work_week'] as const) : (['day'] as const)}
				toolbar={false}
				selectable={false}
				popup={false}
				dayLayoutAlgorithm="no-overlap"
				step={60}
				timeslots={1}
				min={min}
				max={max}
				onSelectEvent={handleSelectEvent}
				tooltipAccessor={tooltipAccessor}
				dayPropGetter={dayPropGetter}
				components={components}
				formats={formats}
				className="text-sm"
			/>
		</div>
	);
}
