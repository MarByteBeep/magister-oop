'use client';

import { cva } from 'class-variance-authority';
import { memo } from 'react';
import { LuClock3, LuMapPin } from 'react-icons/lu';
import LessonHourBadge from '@/components/LessonHourBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getAgendaItemInfo } from '@/lib/agendaUtils';
import { formatTime } from '@/lib/dateUtils';
import { formatLocation } from '@/lib/locationUtils';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import AgendaTooltipContent from './AgendaTooltipContent';

const agendaEventStyles = cva(
	'relative mx-1 h-full overflow-hidden cursor-pointer rounded-lg border text-[12px] text-foreground duration-150 focus-visible:outline-none',
	{
		variants: {
			active: {
				true: 'bg-emerald-500/48 border-emerald-500/70',
				false: 'bg-primary/10 border-border shadow-sm shadow-black/8 hover:bg-primary/18 hover:border-primary/70 dark:bg-muted/85 dark:border-border dark:shadow-sm dark:shadow-black/20 dark:hover:bg-primary/22 dark:hover:border-primary/85',
			},
			compact: {
				true: 'px-1 py-0.5 leading-tight',
				false: 'px-1.5 py-0 leading-none whitespace-nowrap',
			},
		},
	},
);

const metaInfoClasses = 'absolute right-1.5 flex items-center gap-1 text-[9px] text-muted-foreground';
const topMetaInfoClasses = `${metaInfoClasses} top-0.5`;
const bottomMetaInfoClasses = `${metaInfoClasses} bottom-0.5`;
const metaIconClasses = 'h-2.5 w-2.5 shrink-0';
const locationTextClasses = 'max-w-14 truncate';
const compactContentClasses = 'flex h-full min-w-0 items-center gap-1';
const defaultContentClasses = 'flex h-full min-w-0 items-center gap-1 pr-16';

interface AgendaEventProps {
	item: AgendaItem;
	isActive?: boolean;
	isCompact?: boolean;
}

function AgendaEvent({ item, isActive = false, isCompact = false }: AgendaEventProps) {
	const beginTime = new Date(item.begin);
	const endTime = new Date(item.einde);
	const { courseCodes, subject, teachersCodes } = getAgendaItemInfo(item);
	const title = courseCodes ?? subject;
	const firstLocation = formatLocation(item.locaties[0]);
	const teacherCodes =
		teachersCodes
			?.split(',')
			.map((code) => code.trim())
			.filter(Boolean) ?? [];
	const teacherLabel =
		teacherCodes.length > 1 ? `${teacherCodes[0]} e.a.` : teacherCodes.length === 1 ? teacherCodes[0] : undefined;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className={cn(agendaEventStyles({ active: isActive, compact: isCompact }))}>
					{isCompact ? (
						<div className={compactContentClasses}>
							{item.lesuur?.begin && (
								<LessonHourBadge
									lessonInfo={{ status: 'lesson', lesson: item.lesuur.begin }}
									className="h-3.5 w-3.5 shrink-0 text-[0.55rem]"
								/>
							)}
							<span className="truncate font-semibold">{title}</span>
						</div>
					) : (
						<>
							<div className={topMetaInfoClasses}>
								<LuClock3 className={metaIconClasses} />
								<span>
									{formatTime(beginTime)} - {formatTime(endTime)}
								</span>
							</div>

							{firstLocation && (
								<div className={bottomMetaInfoClasses}>
									<LuMapPin className={metaIconClasses} />
									<span className={locationTextClasses}>{firstLocation}</span>
								</div>
							)}

							<div className={defaultContentClasses}>
								{item.lesuur?.begin && (
									<LessonHourBadge
										lessonInfo={{ status: 'lesson', lesson: item.lesuur.begin }}
										className="h-4 w-4 text-[0.65rem] shrink-0"
									/>
								)}
								<span className="truncate font-semibold text-foreground">{title}</span>
								{teacherLabel && <span className="truncate text-muted-foreground">{teacherLabel}</span>}
							</div>
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
		prev.item.einde === next.item.einde,
);
