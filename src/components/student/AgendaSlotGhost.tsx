import { cva, type VariantProps } from 'class-variance-authority';
import { LuClock3 } from 'react-icons/lu';

import LessonHourBadge from '@/components/LessonHourBadge';
import { formatTime } from '@/lib/dateUtils';
import { getLessonHourBadgePlacements } from '@/lib/lessonHours';
import { cn } from '@/lib/utils';

const agendaSlotGhostStyles = cva('relative mx-1 h-full overflow-hidden rounded-lg border', {
	variants: {
		variant: {
			hover: 'border-dashed border-primary/40 bg-primary/8 dark:border-primary/45 dark:bg-primary/8',
			draft: 'border-primary/55 bg-primary/10 shadow-sm shadow-black/8 dark:border-primary/70 dark:bg-primary/22 dark:shadow-black/20',
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
	const placements = getLessonHourBadgePlacements(selection);
	const rangeStart = selection.start <= selection.end ? selection.start : selection.end;
	const rangeEnd = selection.start <= selection.end ? selection.end : selection.start;

	return (
		<div className={cn(agendaSlotGhostStyles({ variant }))}>
			<div className="absolute right-1.5 top-0.5 z-10 flex items-center gap-1 text-[9px] text-muted-foreground">
				<LuClock3 className="h-2.5 w-2.5 shrink-0" />
				<span>
					{formatTime(rangeStart)} - {formatTime(rangeEnd)}
				</span>
			</div>
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
						className="h-4 w-4 shrink-0 text-[0.65rem]"
					/>
				</div>
			))}
		</div>
	);
}
