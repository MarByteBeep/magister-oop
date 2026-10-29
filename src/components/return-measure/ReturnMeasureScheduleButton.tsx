'use client';

import { LuCalendar, LuClock } from 'react-icons/lu';
import { formatDayLabel } from '@/lib/shared/dateLabels';
import { formatTime, parseOptionalDate } from '@/lib/shared/dateUtils';
import { cn } from '@/lib/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

export interface ReturnMeasureScheduleButtonProps {
	measure: ReturnMeasureStudent;
	canOpenAgenda: boolean;
	onOpenAgenda: () => void;
}

function formatTimeRange(measure: ReturnMeasureStudent): string | null {
	const start = parseOptionalDate(measure.begin);
	const end = parseOptionalDate(measure.einde);
	if (!start) return null;
	if (!end) return null;
	return `${formatTime(start)} - ${formatTime(end)}`;
}

function scheduleDateLabel(measure: ReturnMeasureStudent): string | null {
	const start = parseOptionalDate(measure.begin);
	if (!start) return null;
	return formatDayLabel(start);
}

function scheduleButtonClass(canOpenAgenda: boolean): string {
	return cn(
		'flex w-fit max-w-full flex-wrap items-center gap-4 rounded-md p-2 text-sm text-left outline-none',
		'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
		canOpenAgenda ? 'cursor-pointer hover:bg-muted' : 'cursor-default',
	);
}

function agendaAriaLabel(dateLabel: string | null): string | undefined {
	if (!dateLabel) return undefined;
	return `Open rooster op ${dateLabel}`;
}

function ScheduleDateLabel({ dateLabel }: { dateLabel: string | null }) {
	if (!dateLabel) return null;
	return (
		<span className="flex items-center gap-1.5 text-muted-foreground">
			<LuCalendar className="h-4 w-4" />
			<span className="font-medium text-foreground">{dateLabel}</span>
		</span>
	);
}

function scheduleTimeLabel(timeRange: string | null): string {
	if (timeRange) return timeRange;
	return 'Nog niet ingepland';
}

export default function ReturnMeasureScheduleButton({
	measure,
	canOpenAgenda,
	onOpenAgenda,
}: ReturnMeasureScheduleButtonProps) {
	const dateLabel = scheduleDateLabel(measure);
	const timeRange = formatTimeRange(measure);

	return (
		<button
			type="button"
			disabled={!canOpenAgenda}
			className={scheduleButtonClass(canOpenAgenda)}
			onClick={onOpenAgenda}
			aria-label={agendaAriaLabel(dateLabel)}
		>
			<ScheduleDateLabel dateLabel={dateLabel} />
			<span className="flex items-center gap-1.5 text-muted-foreground">
				<LuClock className="h-4 w-4" />
				<span className="font-medium text-foreground">{scheduleTimeLabel(timeRange)}</span>
			</span>
		</button>
	);
}
