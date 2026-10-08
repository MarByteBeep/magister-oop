import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { isSameCalendarDay } from '@/lib/agenda/calendarUtils';
import { fullDayScheduleShortcutTooltip } from '@/lib/agenda/fullDayScheduleUtils';
import { getDateKey } from '@/lib/shared/dateUtils';
import { cn } from '@/lib/utils';

export interface AgendaCalendarHeaderProps {
	date: Date;
	label: string;
	onSelectFullDay?: (date: Date) => void;
	/** Create-mode "Aanmaken vierkant rooster" tooltip; off during reschedule. */
	showCreateTooltip?: boolean;
	highlightDateKey?: string | null;
}

export default function AgendaCalendarHeader({
	date,
	label,
	onSelectFullDay,
	showCreateTooltip = true,
	highlightDateKey,
}: AgendaCalendarHeaderProps) {
	const isToday = isSameCalendarDay(date, new Date());
	const isHighlight = highlightDateKey != null && getDateKey(date) === highlightDateKey;
	const className = cn('h-full w-full', isToday && 'agenda-today-header', isHighlight && 'agenda-highlight-header');

	if (!onSelectFullDay) {
		return <div className={className}>{label}</div>;
	}

	const button = (
		<button
			type="button"
			className={cn(className, 'agenda-full-day-header-button cursor-pointer')}
			onClick={() => onSelectFullDay(date)}
			aria-label={showCreateTooltip ? `${fullDayScheduleShortcutTooltip} op ${label}` : label}
		>
			{label}
		</button>
	);

	if (!showCreateTooltip) return button;

	return (
		<Tooltip>
			<TooltipTrigger asChild>{button}</TooltipTrigger>
			<TooltipContent>{fullDayScheduleShortcutTooltip}</TooltipContent>
		</Tooltip>
	);
}
