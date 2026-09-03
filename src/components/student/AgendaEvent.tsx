'use client';

import { cva } from 'class-variance-authority';
import { type CSSProperties, memo, useRef } from 'react';
import { LuClock3, LuMapPin } from 'react-icons/lu';
import LessonHourBadge from '@/components/LessonHourBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFittingLineCount } from '@/hooks/useFittingLineCount';
import {
	isAbsenceNoticeEntry,
	isLessonEntry,
	isReturnMeasureEntry,
	isSameAgendaEntryOccurrence,
} from '@/lib/agendaEntryUtils';
import { absenceSurfaceClasses, returnMeasureSurfaceClasses } from '@/lib/agendaKindStyles';
import { formatCompactTeacherLabel, getAgendaItemInfo } from '@/lib/agendaUtils';
import { formatTime } from '@/lib/dateUtils';
import { getFullDayScheduleLabel, isFullDayReturnMeasureEntry } from '@/lib/fullDayScheduleUtils';
import { formatLocation } from '@/lib/locationUtils';
import { getReturnMeasureDisplay } from '@/lib/returnMeasureUtils';
import { cn } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import AgendaTooltipContent from './AgendaTooltipContent';
import { ReturnMeasureAlertBadge } from './ReturnMeasureAgendaLabels';

const agendaEventStyles = cva(
	'relative h-full overflow-hidden cursor-pointer rounded-lg border text-[12px] text-foreground duration-150 focus-visible:outline-none',
	{
		variants: {
			kind: {
				lesson: 'mx-1',
				returnMeasureFullDay: `mx-0 ${returnMeasureSurfaceClasses}`,
				returnMeasureGutter: `mx-1 ${returnMeasureSurfaceClasses}`,
				absenceNotice: `mx-1 ${absenceSurfaceClasses}`,
			},
			active: {
				true: 'bg-emerald-500/48 border-emerald-500/70',
				false: 'bg-primary/10 border-border shadow-sm shadow-black/8 hover:bg-primary/18 hover:border-primary/70 dark:bg-muted/85 dark:border-border dark:shadow-sm dark:shadow-black/20 dark:hover:bg-primary/22 dark:hover:border-primary/85',
			},
			compact: {
				true: 'px-1 py-0.5 leading-tight',
				false: 'px-1.5 py-0 leading-none whitespace-nowrap',
			},
		},
		compoundVariants: [
			{
				kind: 'returnMeasureFullDay',
				active: false,
				className: returnMeasureSurfaceClasses,
			},
			{
				kind: 'returnMeasureGutter',
				active: false,
				className: returnMeasureSurfaceClasses,
			},
			{
				kind: 'absenceNotice',
				active: false,
				className: absenceSurfaceClasses,
			},
		],
		defaultVariants: {
			kind: 'lesson',
		},
	},
);

const metaInfoClasses = 'absolute right-1.5 flex items-center gap-1 text-[9px] text-muted-foreground';
const topMetaInfoClasses = `${metaInfoClasses} top-0.5`;
const topLeftMetaInfoClasses = 'absolute left-1 top-0.5';
const fullDayScheduleHeaderClasses =
	'absolute left-1 top-0.5 z-10 flex max-w-[calc(100%-0.5rem)] items-center gap-1 text-[11px] font-semibold text-foreground';
const bottomMetaInfoClasses = `${metaInfoClasses} bottom-0.5`;
const metaIconClasses = 'h-2.5 w-2.5 shrink-0';
const locationTextClasses = 'max-w-14 truncate';
const compactContentClasses = 'flex h-full min-w-0 items-center gap-1';
const gutterContentClasses = 'flex h-full min-w-0 flex-col justify-start overflow-hidden pt-0.5 pb-0.5';
const defaultContentClasses = 'flex h-full min-w-0 items-center gap-1 pr-16';

function getEntryDurationMinutes(entry: AgendaEntry): number {
	return (new Date(entry.end).getTime() - new Date(entry.start).getTime()) / 60_000;
}

function titleClasses(canWrapTitle: boolean) {
	return cn(
		'min-w-0 font-semibold text-foreground',
		canWrapTitle ? 'line-clamp-2 whitespace-normal break-words leading-tight' : 'truncate',
	);
}

function gutterTitleStyle(maxLines: number): CSSProperties {
	return {
		display: '-webkit-box',
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: maxLines,
		overflow: 'hidden',
	};
}

function gutterTitleClasses() {
	return 'min-w-0 w-full break-words leading-tight font-semibold text-foreground';
}

interface AgendaEventProps {
	entry: AgendaEntry;
	isActive?: boolean;
	isCompact?: boolean;
}

function AgendaEvent({ entry, isActive = false, isCompact = false }: AgendaEventProps) {
	const isReturnMeasure = isReturnMeasureEntry(entry);
	const isAbsenceNotice = isAbsenceNoticeEntry(entry);
	const isLesson = isLessonEntry(entry);
	const isFullDayReturnMeasure = isReturnMeasure && isFullDayReturnMeasureEntry(entry);
	const isGutterOverlay = isAbsenceNotice || (isReturnMeasure && !isFullDayReturnMeasure);
	const returnMeasureDisplay = isReturnMeasure ? getReturnMeasureDisplay(entry.measure) : null;
	const beginTime = new Date(entry.start);
	const endTime = new Date(entry.end);
	const lessonItem = isLesson ? entry.item : null;
	const { courseCodes, subject } = lessonItem
		? getAgendaItemInfo(lessonItem)
		: { courseCodes: undefined, subject: undefined };
	const absenceLabel = isAbsenceNotice ? entry.notice.attendanceTypeDesc : undefined;
	const title = isReturnMeasure
		? returnMeasureDisplay?.primaryLabel
		: isAbsenceNotice
			? absenceLabel
			: (courseCodes ?? subject);
	const firstLocation = lessonItem ? formatLocation(lessonItem.locaties[0]) : undefined;
	const teacherLabel = lessonItem ? formatCompactTeacherLabel(lessonItem) : undefined;
	const durationMinutes = getEntryDurationMinutes(entry);
	const canWrapTitle = durationMinutes > 60;
	const gutterContentRef = useRef<HTMLDivElement>(null);
	const gutterLineCount = useFittingLineCount(gutterContentRef);
	const kind = isFullDayReturnMeasure
		? 'returnMeasureFullDay'
		: isReturnMeasure
			? 'returnMeasureGutter'
			: isAbsenceNotice
				? 'absenceNotice'
				: 'lesson';
	const compact = isCompact || isGutterOverlay;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					className={cn(
						agendaEventStyles({
							kind,
							active: isGutterOverlay || isFullDayReturnMeasure ? false : isActive,
							compact,
						}),
					)}
				>
					{isFullDayReturnMeasure ? (
						<>
							<div className={fullDayScheduleHeaderClasses}>
								<ReturnMeasureAlertBadge />
								<span className="truncate">{getFullDayScheduleLabel()}</span>
							</div>
							<span className="sr-only">
								{returnMeasureDisplay?.primaryLabel ?? getFullDayScheduleLabel()}
							</span>
						</>
					) : (
						<>
							{returnMeasureDisplay?.hasBoth && isGutterOverlay && (
								<div className={topLeftMetaInfoClasses}>
									<ReturnMeasureAlertBadge />
								</div>
							)}
							{compact ? (
								<div
									ref={isGutterOverlay ? gutterContentRef : undefined}
									className={cn(
										isGutterOverlay ? gutterContentClasses : compactContentClasses,
										returnMeasureDisplay?.hasBoth && isGutterOverlay && 'pl-3',
									)}
								>
									{isLesson && entry.item.lesuur?.begin && (
										<LessonHourBadge
											lessonInfo={{ status: 'lesson', lesson: entry.item.lesuur.begin }}
											className="h-3.5 w-3.5 shrink-0 text-[0.55rem]"
										/>
									)}
									{isGutterOverlay ? (
										<span
											className={gutterTitleClasses()}
											style={gutterTitleStyle(gutterLineCount)}
										>
											{title}
										</span>
									) : (
										<>
											<span className={titleClasses(canWrapTitle)}>{title}</span>
											{teacherLabel && (
												<span className="truncate text-muted-foreground">{teacherLabel}</span>
											)}
										</>
									)}
								</div>
							) : (
								<>
									<div className={topMetaInfoClasses}>
										<LuClock3 className={metaIconClasses} />
										<span>
											{formatTime(beginTime)} - {formatTime(endTime)}
										</span>
									</div>

									{isLesson && firstLocation && (
										<div className={bottomMetaInfoClasses}>
											<LuMapPin className={metaIconClasses} />
											<span className={locationTextClasses}>{firstLocation}</span>
										</div>
									)}

									<div className={defaultContentClasses}>
										{isLesson && entry.item.lesuur?.begin && (
											<LessonHourBadge
												lessonInfo={{ status: 'lesson', lesson: entry.item.lesuur.begin }}
												className="h-4 w-4 text-[0.65rem] shrink-0"
											/>
										)}
										<span className={titleClasses(canWrapTitle)}>{title}</span>
										{teacherLabel && (
											<span className="truncate text-muted-foreground">{teacherLabel}</span>
										)}
									</div>
								</>
							)}
						</>
					)}
				</div>
			</TooltipTrigger>
			<TooltipContent>
				<AgendaTooltipContent entry={entry} />
			</TooltipContent>
		</Tooltip>
	);
}

export default memo(
	AgendaEvent,
	(prev, next) =>
		prev.isCompact === next.isCompact &&
		prev.isActive === next.isActive &&
		isSameAgendaEntryOccurrence(prev.entry, next.entry),
);
