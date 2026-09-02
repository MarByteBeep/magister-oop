'use client';

import { cva } from 'class-variance-authority';
import { memo } from 'react';
import { LuClock3, LuMapPin } from 'react-icons/lu';
import LessonHourBadge from '@/components/LessonHourBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCompactTeacherLabel, getAgendaItemInfo } from '@/lib/agendaUtils';
import { formatTime } from '@/lib/dateUtils';
import { getFullDayScheduleLabel, isFullDaySchedule } from '@/lib/fullDayScheduleUtils';
import { formatLocation } from '@/lib/locationUtils';
import { getReturnMeasureDisplay, isReturnMeasureAgendaItem } from '@/lib/returnMeasureUtils';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import AgendaTooltipContent from './AgendaTooltipContent';
import ReturnMeasureAgendaLabels, { ReturnMeasureAlertBadge } from './ReturnMeasureAgendaLabels';

const agendaEventStyles = cva(
	'relative h-full overflow-hidden cursor-pointer rounded-lg border text-[12px] text-foreground duration-150 focus-visible:outline-none',
	{
		variants: {
			kind: {
				lesson: 'mx-1',
				returnMeasure:
					'mx-0 bg-orange-500/45 border-orange-500/70 hover:bg-orange-500/55 hover:border-orange-500/85',
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
				kind: 'returnMeasure',
				active: false,
				className:
					'bg-orange-500/45 border-orange-500/70 hover:bg-orange-500/55 hover:border-orange-500/85 dark:bg-orange-500/35 dark:border-orange-500/60',
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
const defaultContentClasses = 'flex h-full min-w-0 items-center gap-1 pr-16';

function getAgendaItemDurationMinutes(item: AgendaItem): number {
	return (new Date(item.einde).getTime() - new Date(item.begin).getTime()) / 60_000;
}

function titleClasses(canWrapTitle: boolean) {
	return cn(
		'min-w-0 font-semibold text-foreground',
		canWrapTitle ? 'line-clamp-2 whitespace-normal break-words leading-tight' : 'truncate',
	);
}

interface AgendaEventProps {
	item: AgendaItem;
	isActive?: boolean;
	isCompact?: boolean;
}

function AgendaEvent({ item, isActive = false, isCompact = false }: AgendaEventProps) {
	const isReturnMeasure = isReturnMeasureAgendaItem(item);
	const returnMeasureDisplay = isReturnMeasure ? getReturnMeasureDisplay(item) : null;
	const isFullDay = isFullDaySchedule(item);
	const beginTime = new Date(item.begin);
	const endTime = new Date(item.einde);
	const { courseCodes, subject } = getAgendaItemInfo(item);
	const title = isReturnMeasure ? returnMeasureDisplay?.primaryLabel : (courseCodes ?? subject);
	const firstLocation = formatLocation(item.locaties[0]);
	const teacherLabel = formatCompactTeacherLabel(item);
	const canWrapTitle = getAgendaItemDurationMinutes(item) > 60;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					className={cn(
						agendaEventStyles({
							kind: isReturnMeasure ? 'returnMeasure' : 'lesson',
							active: isReturnMeasure ? false : isActive,
							compact: isCompact,
						}),
					)}
				>
					{isFullDay ? (
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
							{returnMeasureDisplay?.hasBoth && (
								<div className={topLeftMetaInfoClasses}>
									<ReturnMeasureAlertBadge />
								</div>
							)}
							{isCompact ? (
								<div className={compactContentClasses}>
									{!isReturnMeasure && item.lesuur?.begin && (
										<LessonHourBadge
											lessonInfo={{ status: 'lesson', lesson: item.lesuur.begin }}
											className="h-3.5 w-3.5 shrink-0 text-[0.55rem]"
										/>
									)}
									{isReturnMeasure ? (
										<ReturnMeasureAgendaLabels item={item} canWrapTitle={canWrapTitle} compact />
									) : (
										<span className={titleClasses(canWrapTitle)}>{title}</span>
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

									{!isReturnMeasure && firstLocation && (
										<div className={bottomMetaInfoClasses}>
											<LuMapPin className={metaIconClasses} />
											<span className={locationTextClasses}>{firstLocation}</span>
										</div>
									)}

									<div
										className={cn(
											defaultContentClasses,
											isReturnMeasure && 'pr-1',
											returnMeasureDisplay?.hasBoth && 'pl-4',
										)}
									>
										{!isReturnMeasure && item.lesuur?.begin && (
											<LessonHourBadge
												lessonInfo={{ status: 'lesson', lesson: item.lesuur.begin }}
												className="h-4 w-4 text-[0.65rem] shrink-0"
											/>
										)}
										{isReturnMeasure ? (
											<ReturnMeasureAgendaLabels item={item} canWrapTitle={canWrapTitle} />
										) : (
											<>
												<span className={titleClasses(canWrapTitle)}>{title}</span>
												{teacherLabel && (
													<span className="truncate text-muted-foreground">
														{teacherLabel}
													</span>
												)}
											</>
										)}
									</div>
								</>
							)}
						</>
					)}
				</div>
			</TooltipTrigger>
			<TooltipContent>
				<AgendaTooltipContent item={item} />
			</TooltipContent>
		</Tooltip>
	);
}

export default memo(
	AgendaEvent,
	(prev, next) =>
		prev.isCompact === next.isCompact &&
		prev.isActive === next.isActive &&
		prev.item.id === next.item.id &&
		prev.item.begin === next.item.begin &&
		prev.item.einde === next.item.einde &&
		prev.item.returnMeasureMaatregelOmschrijving === next.item.returnMeasureMaatregelOmschrijving &&
		prev.item.returnMeasureOmschrijving === next.item.returnMeasureOmschrijving,
);
