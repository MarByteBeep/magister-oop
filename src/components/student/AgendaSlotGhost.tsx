import { cva, type VariantProps } from 'class-variance-authority';
import { LuClock3 } from 'react-icons/lu';

import LessonHourBadge from '@/components/LessonHourBadge';
import { returnMeasureSurfaceClasses } from '@/lib/agendaKindStyles';
import { formatTime } from '@/lib/dateUtils';
import { getFullDayScheduleLabel, isFullDayScheduleSelection } from '@/lib/fullDayScheduleUtils';
import { getLessonHourBadgePlacements } from '@/lib/lessonHours';
import { cn } from '@/lib/utils';
import { ReturnMeasureAlertBadge } from './ReturnMeasureAgendaLabels';

const agendaSlotGhostStyles = cva('relative h-full overflow-hidden rounded-lg border', {
	variants: {
		variant: {
			hover: 'mx-1 border-dashed border-primary/40 bg-primary/8 dark:border-primary/45 dark:bg-primary/8',
			draft: 'mx-1 border-primary/55 bg-primary/10 shadow-sm shadow-black/8 dark:border-primary/70 dark:bg-primary/22 dark:shadow-black/20',
		},
		fullDay: {
			true: cn('mx-0 border-dashed', returnMeasureSurfaceClasses),
			false: '',
		},
	},
	defaultVariants: {
		variant: 'hover',
		fullDay: false,
	},
});

const ghostLessonBadgeStyles = cva('border font-bold', {
	variants: {
		variant: {
			hover: 'border-primary/30 bg-primary/15 text-primary dark:bg-primary/20',
			draft: 'border-primary/40 bg-primary/25 text-primary dark:bg-primary/30',
		},
	},
	defaultVariants: {
		variant: 'hover',
	},
});

interface AgendaSlotGhostProps extends VariantProps<typeof agendaSlotGhostStyles> {
	selection: { start: Date; end: Date };
}

export default function AgendaSlotGhost({ variant, selection }: AgendaSlotGhostProps) {
	const isFullDay = isFullDayScheduleSelection(selection);
	const placements = isFullDay ? [] : getLessonHourBadgePlacements(selection);
	const rangeStart = selection.start <= selection.end ? selection.start : selection.end;
	const rangeEnd = selection.start <= selection.end ? selection.end : selection.start;

	return (
		<div className={cn(agendaSlotGhostStyles({ variant, fullDay: isFullDay }))}>
			{isFullDay ? (
				<div className="absolute left-1 top-0.5 z-10 flex max-w-[calc(100%-0.5rem)] items-center gap-1 text-[11px] font-semibold text-foreground">
					<ReturnMeasureAlertBadge />
					<span className="truncate">{getFullDayScheduleLabel()}</span>
				</div>
			) : (
				<div className="absolute right-1.5 top-0.5 z-10 flex items-center gap-1 text-[9px] text-muted-foreground">
					<LuClock3 className="h-2.5 w-2.5 shrink-0" />
					<span>
						{formatTime(rangeStart)} - {formatTime(rangeEnd)}
					</span>
				</div>
			)}
			{placements.map((placement) => (
				<div
					key={placement.lessonHour}
					className="absolute left-1.5 flex items-center"
					style={{
						top: `${placement.topPercent}%`,
						height: `${placement.heightPercent}%`,
					}}
				>
					<LessonHourBadge
						lessonInfo={{ status: 'lesson', lesson: placement.lessonHour }}
						className={cn('h-4 w-4 shrink-0 text-[0.65rem]', ghostLessonBadgeStyles({ variant }))}
					/>
				</div>
			))}
		</div>
	);
}
