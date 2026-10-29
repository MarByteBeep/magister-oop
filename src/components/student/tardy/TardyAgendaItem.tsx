import AgendaTooltipContent from '@/components/student/agenda/calendar/AgendaTooltipContent';
import LessonHourBadge from '@/components/student/agenda/calendar/LessonHourBadge';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getAgendaItemInfo } from '@/lib/agenda/utils';
import { formatTime } from '@/lib/shared/dateUtils';
import type { AgendaEntry, LessonAgendaEntry } from '@/magister/response/agendaEntry.types';

function tardyItemClassName(isCurrent: boolean, isPast: boolean): string {
	const base = 'relative flex items-start gap-2 p-2.5 border rounded-md transition-all duration-150 text-left';
	if (isCurrent) return `${base} bg-card-foreground/30 border-primary cursor-default`;
	if (isPast) return `${base} bg-card hover:bg-accent hover:border-primary/50 hover:shadow-sm cursor-pointer`;
	return `${base} bg-muted/30 border-muted opacity-60 cursor-not-allowed`;
}

function tardyTitleClassName(isPast: boolean): string {
	if (isPast) return 'font-semibold truncate';
	return 'font-semibold truncate text-muted-foreground';
}

export interface TardyAgendaItemProps {
	entry: LessonAgendaEntry;
	currentTime: Date;
	isCurrent: boolean;
	onSelect: (entry: AgendaEntry) => void;
}

function TardyCurrentBadge({ isCurrent }: { isCurrent: boolean }) {
	if (!isCurrent) return null;

	return (
		<Badge
			variant="default"
			className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[0.6rem] px-1 py-0 z-10"
		>
			Nu
		</Badge>
	);
}

function TardyLessonHour({ begin }: { begin: number | undefined }) {
	if (begin === undefined) return null;

	return (
		<LessonHourBadge
			lessonInfo={{
				status: 'lesson',
				lesson: begin,
			}}
			className="h-4 w-4 text-[0.6rem] shrink-0"
		/>
	);
}

function courseTitle(courseDescriptions: string | undefined, subject: string | undefined): string | undefined {
	if (courseDescriptions !== undefined) return courseDescriptions;
	return subject;
}

function lessonBeginOf(entry: LessonAgendaEntry): number | undefined {
	const lesuur = entry.item.lesuur;
	if (lesuur === undefined) return undefined;
	return lesuur.begin;
}

function TardyAgendaItemBody({ entry, currentTime, isCurrent, onSelect }: TardyAgendaItemProps) {
	const beginTime = new Date(entry.start);
	const endTime = new Date(entry.end);
	const { locations, courseDescriptions, subject, teachersCodes } = getAgendaItemInfo(entry.item);
	const isPast = beginTime <= currentTime;
	const secondLineParts = [`${formatTime(beginTime)}-${formatTime(endTime)}`, locations, teachersCodes].filter(
		Boolean,
	);

	return (
		<button
			type="button"
			disabled={!isPast}
			onClick={() => onSelect(entry)}
			className={tardyItemClassName(isCurrent, isPast)}
		>
			<TardyCurrentBadge isCurrent={isCurrent} />
			<div className="flex flex-col gap-0.5 items-start flex-1 min-w-0">
				<div className="flex items-center gap-0.5 w-full">
					<TardyLessonHour begin={lessonBeginOf(entry)} />
					<span className={tardyTitleClassName(isPast)}>{courseTitle(courseDescriptions, subject)}</span>
				</div>
				<span className="text-[0.6rem] text-muted-foreground truncate text-left">
					{secondLineParts.join(' · ')}
				</span>
			</div>
		</button>
	);
}

export default function TardyAgendaItem(props: TardyAgendaItemProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<TardyAgendaItemBody {...props} />
			</TooltipTrigger>
			<TooltipContent>
				<AgendaTooltipContent entry={props.entry} />
			</TooltipContent>
		</Tooltip>
	);
}
