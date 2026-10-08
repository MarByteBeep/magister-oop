import { cva, type VariantProps } from 'class-variance-authority';
import { LuClock3 } from 'react-icons/lu';

import LessonHourBadge from '@/components/student/agenda/LessonHourBadge';
import { getFullDayScheduleLabel, isFullDayScheduleSelection } from '@/lib/agenda/fullDayScheduleUtils';
import {
	agendaDraftOverlayBadgeClasses,
	agendaDraftOverlaySurfaceClasses,
	agendaHoverOverlayBadgeClasses,
	agendaHoverOverlaySurfaceClasses,
} from '@/lib/agenda/kindStyles';
import { getLessonHourBadgePlacements } from '@/lib/agenda/lessonHours';
import { formatTime } from '@/lib/shared/dateUtils';
import { cn } from '@/lib/utils';

/**
 * Overlay ghosts (selection vs hover). Existing return measures use
 * {@link returnMeasureGhostSurfaceClasses} on AgendaEvent — same hue, ghosted.
 */
const agendaSlotGhostStyles = cva('relative h-full overflow-hidden rounded-lg border', {
	variants: {
		variant: {
			hover: cn('mx-1', agendaHoverOverlaySurfaceClasses),
			draft: cn('mx-1', agendaDraftOverlaySurfaceClasses),
		},
		fullDay: {
			true: 'mx-0',
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
			hover: agendaHoverOverlayBadgeClasses,
			draft: agendaDraftOverlayBadgeClasses,
		},
	},
	defaultVariants: {
		variant: 'hover',
	},
});

interface AgendaSlotGhostProps extends VariantProps<typeof agendaSlotGhostStyles> {
	selection: { start: Date; end: Date; title?: string };
	/** One-shot appear pulse for drafts; omit on remounts after the first claim. */
	playAppear?: boolean;
}

export default function AgendaSlotGhost({ variant, selection, playAppear = false }: AgendaSlotGhostProps) {
	const isFullDay = isFullDayScheduleSelection(selection);
	const placements = isFullDay ? [] : getLessonHourBadgePlacements(selection);
	const rangeStart = selection.start <= selection.end ? selection.start : selection.end;
	const rangeEnd = selection.start <= selection.end ? selection.end : selection.start;
	const label = selection.title?.trim() || null;
	const fullDayHeading = label ?? getFullDayScheduleLabel();

	return (
		<div
			className={cn(
				agendaSlotGhostStyles({ variant, fullDay: isFullDay }),
				variant === 'draft' && playAppear && 'agenda-draft-appear',
			)}
		>
			{isFullDay ? (
				<div className="absolute left-1 top-0.5 z-10 flex max-w-[calc(100%-0.5rem)] items-center gap-1 text-[11px] font-semibold text-foreground">
					<span className="truncate">{fullDayHeading}</span>
				</div>
			) : (
				<>
					<div className="absolute right-1.5 top-0.5 z-10 flex items-center gap-1 text-[9px] text-muted-foreground">
						<LuClock3 className="h-2.5 w-2.5 shrink-0" />
						<span>
							{formatTime(rangeStart)} - {formatTime(rangeEnd)}
						</span>
					</div>
					{label ? (
						<div
							className={cn(
								'flex h-full min-w-0 items-center',
								placements.length > 0 ? 'pl-6 pr-16' : 'px-1.5 pr-16',
							)}
						>
							<span className="min-w-0 truncate text-[12px] font-semibold leading-tight text-foreground">
								{label}
							</span>
						</div>
					) : null}
				</>
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
