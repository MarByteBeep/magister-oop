import { memo } from 'react';
import AgendaTooltipContent from '@/components/student/agenda/calendar/AgendaTooltipContent';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { isAbsenceNoticeEntry, isReturnMeasureEntry } from '@/lib/agenda/entryUtils';
import { getFullDayScheduleLabel, isFullDayReturnMeasureEntry } from '@/lib/agenda/fullDayScheduleUtils';
import { absenceTextClasses, returnMeasureTextClasses } from '@/lib/agenda/kindStyles';
import { getAgendaItemInfo } from '@/lib/agenda/utils';
import { getReturnMeasureDisplay } from '@/lib/return-measure/utils';
import { cn, deepEqual } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

type AgendaItemLessonInfo = {
	locations: string | undefined;
	courseCodes: string | undefined;
	teachersCodes: string | undefined;
	subject: string | undefined;
};

const emptyLessonInfo: AgendaItemLessonInfo = {
	locations: undefined,
	courseCodes: undefined,
	teachersCodes: undefined,
	subject: undefined,
};

/** Two lines before ellipsis; overrides the `whitespace-nowrap` the table cell sets. */
const clampedLabelClasses = 'block font-medium line-clamp-2 whitespace-normal break-words leading-tight';

function lessonInfoOf(entry: AgendaEntry): AgendaItemLessonInfo {
	if (entry.kind !== 'lesson') return emptyLessonInfo;
	return getAgendaItemInfo(entry.item);
}

function returnMeasureLabelOf(entry: AgendaEntry): string | null {
	if (!isReturnMeasureEntry(entry)) return null;
	if (isFullDayReturnMeasureEntry(entry)) return getFullDayScheduleLabel();
	return getReturnMeasureDisplay(entry.measure).primaryLabel;
}

function absenceNoticeLabelOf(entry: AgendaEntry): string | null {
	if (!isAbsenceNoticeEntry(entry)) return null;
	return entry.notice.attendanceTypeDescription;
}

function ReturnMeasureDisplayLabel({ label }: { label: string }) {
	return (
		<div className="w-full min-w-0">
			<span className={cn(clampedLabelClasses, returnMeasureTextClasses)}>{label}</span>
		</div>
	);
}

function AbsenceNoticeDisplayLabel({ label }: { label: string }) {
	return (
		<div className="w-full min-w-0">
			<span className={cn(clampedLabelClasses, absenceTextClasses)}>{label}</span>
		</div>
	);
}

function LessonLocationSuffix({ locations }: { locations: string | undefined }) {
	if (!locations) return null;
	return <span className="text-muted-foreground"> ({locations})</span>;
}

function LessonDisplayLabel({ info }: { info: AgendaItemLessonInfo }) {
	return (
		<>
			<div className="w-full min-w-0 truncate">
				<span className="font-medium text-foreground">{info.courseCodes ?? info.subject}</span>
				<LessonLocationSuffix locations={info.locations} />
			</div>
			<div className="w-full min-w-0 truncate">
				<span className="text-xs text-muted-foreground">{info.teachersCodes}</span>
			</div>
		</>
	);
}

function AgendaItemPrimaryLabels({
	returnMeasureLabel,
	absenceLabel,
	lessonInfo,
}: {
	returnMeasureLabel: string | null;
	absenceLabel: string | null;
	lessonInfo: AgendaItemLessonInfo;
}) {
	if (returnMeasureLabel !== null) {
		return <ReturnMeasureDisplayLabel label={returnMeasureLabel} />;
	}
	if (absenceLabel !== null) {
		return <AbsenceNoticeDisplayLabel label={absenceLabel} />;
	}
	return <LessonDisplayLabel info={lessonInfo} />;
}

interface AgendaItemDisplayContentProps {
	entry: AgendaEntry;
}

function AgendaItemDisplayContent({ entry }: AgendaItemDisplayContentProps) {
	return (
		<div className="flex flex-col items-start text-left w-full min-w-0">
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="flex flex-col w-full min-w-0">
						<AgendaItemPrimaryLabels
							returnMeasureLabel={returnMeasureLabelOf(entry)}
							absenceLabel={absenceNoticeLabelOf(entry)}
							lessonInfo={lessonInfoOf(entry)}
						/>
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<AgendaTooltipContent entry={entry} />
				</TooltipContent>
			</Tooltip>
		</div>
	);
}

// Custom comparator: only `entry` exists today — extend when adding props.
export default memo(AgendaItemDisplayContent, (prev, next) => deepEqual(prev.entry, next.entry));
