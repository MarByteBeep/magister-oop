import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { isSameCalendarDay } from '@/lib/agendaCalendarUtils';
import { fullDayScheduleShortcutTooltip } from '@/lib/fullDayScheduleUtils';
import { cn } from '@/lib/utils';

interface AgendaCalendarHeaderProps {
	date: Date;
	label: string;
	onSelectFullDay?: (date: Date) => void;
}

export default function AgendaCalendarHeader({ date, label, onSelectFullDay }: AgendaCalendarHeaderProps) {
	const isToday = isSameCalendarDay(date, new Date());
	const className = cn('h-full w-full', isToday && 'agenda-today-header');

	if (!onSelectFullDay) {
		return <div className={className}>{label}</div>;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					className={cn(className, 'agenda-full-day-header-button cursor-pointer')}
					onClick={() => onSelectFullDay(date)}
					aria-label={`${fullDayScheduleShortcutTooltip} op ${label}`}
				>
					{label}
				</button>
			</TooltipTrigger>
			<TooltipContent>{fullDayScheduleShortcutTooltip}</TooltipContent>
		</Tooltip>
	);
}
