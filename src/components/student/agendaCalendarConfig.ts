import { format, getDay, parse, startOfWeek } from 'date-fns';
import { nl } from 'date-fns/locale/nl';
import { dateFnsLocalizer, type Formats } from 'react-big-calendar';
import { getLessonDayBounds } from '@/lib/bigCalendarUtils';

export const agendaLocalizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
	getDay,
	locales: { nl },
});

export const { firstLessonTime, lastLessonTime } = getLessonDayBounds();

export const agendaCalendarMessages = {
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

export const agendaCalendarFormats: Partial<Formats> = {
	dayFormat: (d: Date, _culture, loc) => loc?.format(d, 'EEE d', 'nl') ?? format(d, 'EEE d', { locale: nl }),
	timeGutterFormat: (d: Date, _culture, loc) => loc?.format(d, 'HH:mm', 'nl') ?? format(d, 'HH:mm', { locale: nl }),
};
