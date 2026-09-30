'use client';

import { LuCalendar, LuClock } from 'react-icons/lu';
import { formatDayLabel } from '@/lib/shared/dateLabels';
import { formatTime, parseOptionalDate } from '@/lib/shared/dateUtils';
import { cn } from '@/lib/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

interface ReturnMeasureScheduleButtonProps {
	measure: ReturnMeasureStudent;
	canOpenAgenda: boolean;
	onOpenAgenda: () => void;
}

function formatTimeRange(measure: ReturnMeasureStudent): string | null {
	const start = parseOptionalDate(measure.begin);
	const end = parseOptionalDate(measure.einde);
	if (!start || !end) return null;
	return `${formatTime(start)} - ${formatTime(end)}`;
}

export default function ReturnMeasureScheduleButton({
	measure,
	canOpenAgenda,
	onOpenAgenda,
}: ReturnMeasureScheduleButtonProps) {
	const start = parseOptionalDate(measure.begin);
	const dateLabel = start ? formatDayLabel(start) : null;
	const timeRange = formatTimeRange(measure);

	return (
		<button
			type="button"
			disabled={!canOpenAgenda}
			className={cn(
				'flex w-fit max-w-full flex-wrap items-center gap-4 rounded-md p-2 text-sm text-left outline-none',
				'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
				canOpenAgenda ? 'cursor-pointer hover:bg-muted' : 'cursor-default',
			)}
			onClick={onOpenAgenda}
			aria-label={dateLabel ? `Open rooster op ${dateLabel}` : undefined}
		>
			{dateLabel && (
				<span className="flex items-center gap-1.5 text-muted-foreground">
					<LuCalendar className="h-4 w-4" />
					<span className="font-medium text-foreground">{dateLabel}</span>
				</span>
			)}
			<span className="flex items-center gap-1.5 text-muted-foreground">
				<LuClock className="h-4 w-4" />
				<span className="font-medium text-foreground">{timeRange ?? 'Nog niet ingepland'}</span>
			</span>
		</button>
	);
}
