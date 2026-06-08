import { isSameCalendarDay } from '@/lib/agendaCalendarUtils';
import { cn } from '@/lib/utils';

interface AgendaCalendarHeaderProps {
	date: Date;
	label: string;
}

export default function AgendaCalendarHeader({ date, label }: AgendaCalendarHeaderProps) {
	const isToday = isSameCalendarDay(date, new Date());
	return <div className={cn('h-full w-full', isToday && 'agenda-today-header')}>{label}</div>;
}
