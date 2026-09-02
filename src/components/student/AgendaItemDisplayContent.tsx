import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { isAbsenceNoticeEntry, isReturnMeasureEntry } from '@/lib/agendaEntryUtils';
import { getAgendaItemInfo } from '@/lib/agendaUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import AgendaTooltipContent from './AgendaTooltipContent';
import ReturnMeasureAgendaLabels from './ReturnMeasureAgendaLabels';

interface AgendaItemDisplayContentProps {
	entry: AgendaEntry;
}

export default function AgendaItemDisplayContent({ entry }: AgendaItemDisplayContentProps) {
	const isReturnMeasure = isReturnMeasureEntry(entry);
	const isAbsenceNotice = isAbsenceNoticeEntry(entry);
	const lessonItem = entry.kind === 'lesson' ? entry.item : null;
	const { locations, courseCodes, teachersCodes, subject } = lessonItem
		? getAgendaItemInfo(lessonItem)
		: { locations: undefined, courseCodes: undefined, teachersCodes: undefined, subject: undefined };

	return (
		<div className="flex flex-col items-start text-left w-full min-w-0">
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="flex flex-col w-full min-w-0">
						{isReturnMeasure ? (
							<ReturnMeasureAgendaLabels measure={entry.measure} />
						) : isAbsenceNotice ? (
							<div className="w-full min-w-0 truncate">
								<span className="font-medium text-blue-700 dark:text-blue-300">
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
