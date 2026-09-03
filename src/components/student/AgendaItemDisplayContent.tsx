import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { isAbsenceNoticeEntry, isReturnMeasureEntry } from '@/lib/agendaEntryUtils';
import { absenceTextClasses, returnMeasureTextClasses } from '@/lib/agendaKindStyles';
import { getAgendaItemInfo } from '@/lib/agendaUtils';
import { getFullDayScheduleLabel, isFullDayReturnMeasureEntry } from '@/lib/fullDayScheduleUtils';
import { getReturnMeasureDisplay } from '@/lib/returnMeasureUtils';
import { cn } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import AgendaTooltipContent from './AgendaTooltipContent';

interface AgendaItemDisplayContentProps {
	entry: AgendaEntry;
}

/** Two lines before ellipsis; overrides the `whitespace-nowrap` the table cell sets. */
const clampedLabelClasses = 'block font-medium line-clamp-2 whitespace-normal break-words leading-tight';

export default function AgendaItemDisplayContent({ entry }: AgendaItemDisplayContentProps) {
	const isReturnMeasure = isReturnMeasureEntry(entry);
	const isAbsenceNotice = isAbsenceNoticeEntry(entry);
	const isFullDayReturnMeasure = isReturnMeasure && isFullDayReturnMeasureEntry(entry);
	const lessonItem = entry.kind === 'lesson' ? entry.item : null;
	const { locations, courseCodes, teachersCodes, subject } = lessonItem
		? getAgendaItemInfo(lessonItem)
		: { locations: undefined, courseCodes: undefined, teachersCodes: undefined, subject: undefined };
	const returnMeasureLabel = isReturnMeasure
		? isFullDayReturnMeasure
			? getFullDayScheduleLabel()
			: getReturnMeasureDisplay(entry.measure).primaryLabel
		: null;

	return (
		<div className="flex flex-col items-start text-left w-full min-w-0">
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="flex flex-col w-full min-w-0">
						{returnMeasureLabel != null ? (
							<div className="w-full min-w-0">
								<span className={cn(clampedLabelClasses, returnMeasureTextClasses)}>
									{returnMeasureLabel}
								</span>
							</div>
						) : isAbsenceNotice ? (
							<div className="w-full min-w-0">
								<span className={cn(clampedLabelClasses, absenceTextClasses)}>
									{entry.notice.attendanceTypeDesc}
								</span>
							</div>
						) : (
							<>
								<div className="w-full min-w-0 truncate">
									<span className="font-medium text-foreground">{courseCodes ?? subject}</span>
									{locations && <span className="text-muted-foreground"> ({locations})</span>}
								</div>
								<div className="w-full min-w-0 truncate">
									<span className="text-xs text-muted-foreground">{teachersCodes}</span>
								</div>
							</>
						)}
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<AgendaTooltipContent entry={entry} />
				</TooltipContent>
			</Tooltip>
		</div>
	);
}
