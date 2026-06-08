import LessonHourBadge from '@/components/LessonHourBadge';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getAgendaItemInfo } from '@/lib/agendaUtils';
import { formatTime } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import AgendaTooltipContent from './AgendaTooltipContent';

interface TardyAgendaItemProps {
	item: AgendaItem;
	currentTime: Date;
	isCurrent: boolean;
	onSelect: (item: AgendaItem) => void;
}

export default function TardyAgendaItem({ item, currentTime, isCurrent, onSelect }: TardyAgendaItemProps) {
	const beginTime = new Date(item.begin);
	const endTime = new Date(item.einde);
	const { locations, courseDescriptions, subject, teachersCodes } = getAgendaItemInfo(item);
	const isPast = beginTime <= currentTime;

	const secondLineParts = [`${formatTime(beginTime)}-${formatTime(endTime)}`, locations, teachersCodes].filter(
		Boolean,
	);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					disabled={!isPast}
					onClick={() => onSelect(item)}
					className={cn(
						'relative flex items-start gap-2 p-2.5 border rounded-md transition-all duration-150 text-left',
						isCurrent
							? 'bg-card-foreground/30 border-primary cursor-default'
							: isPast
								? 'bg-card hover:bg-accent hover:border-primary/50 hover:shadow-sm cursor-pointer'
								: 'bg-muted/30 border-muted opacity-60 cursor-not-allowed',
					)}
				>
					{isCurrent && (
						<Badge
							variant="default"
							className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[0.6rem] px-1 py-0 z-10"
						>
							Nu
						</Badge>
					)}
					<div className="flex flex-col gap-0.5 items-start flex-1 min-w-0">
						<div className="flex items-center gap-0.5 w-full">
							{item.lesuur?.begin && (
								<LessonHourBadge
									lessonInfo={{ status: 'lesson', lesson: item.lesuur.begin }}
									className="h-4 w-4 text-[0.6rem] shrink-0"
								/>
							)}
							<span className={cn('font-semibold truncate', !isPast && 'text-muted-foreground')}>
								{courseDescriptions ?? subject}
							</span>
						</div>
						<span className="text-[0.6rem] text-muted-foreground truncate text-left">
							{secondLineParts.join(' · ')}
						</span>
					</div>
				</button>
			</TooltipTrigger>
			<TooltipContent>
				<AgendaTooltipContent item={item} />
			</TooltipContent>
		</Tooltip>
	);
}
