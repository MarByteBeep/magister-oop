'use client';

import ReturnMeasureHandledTooltipContent from '@/components/return-measure/ReturnMeasureHandledTooltipContent';
import ReturnMeasureReportActions from '@/components/return-measure/ReturnMeasureReportActions';
import ReturnMeasureStatusBadges from '@/components/return-measure/ReturnMeasureStatusBadges';
import StudentItem from '@/components/student/StudentItem';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ReturnMeasureRow as Row } from '@/lib/return-measure/overview';
import { getReturnMeasureHandledInfo } from '@/lib/return-measure/utils';
import { formatTime, parseOptionalDate } from '@/lib/shared/dateUtils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

function formatTimeRange(row: Row): string | null {
	const start = parseOptionalDate(row.start);
	const end = parseOptionalDate(row.end);
	if (!start) return null;
	if (!end) return null;
	return `${formatTime(start)} - ${formatTime(end)}`;
}

function measureRowLabel(row: Row): string {
	const timeRange = formatTimeRange(row);
	const joined = [timeRange, row.primaryLabel, row.secondaryLabel].filter(Boolean).join(' · ');
	if (joined) return joined;
	return 'Terugkommaatregel';
}

function hasHandledTooltip(measure: ReturnMeasureStudent): boolean {
	const { handledBy, handledAt } = getReturnMeasureHandledInfo(measure);
	if (handledBy !== null) return true;
	return handledAt !== null;
}

export interface ReturnMeasureRowProps {
	row: Row;
	student?: Student;
	onSelectMeasure: (measure: ReturnMeasureStudent) => void;
}

function ReturnMeasureRowCard({ row, student, onSelectMeasure }: ReturnMeasureRowProps) {
	return (
		<div className="flex w-full items-center gap-2 rounded-md border bg-muted/50 p-2 hover:bg-muted">
			<button
				type="button"
				className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md text-left"
				onClick={() => onSelectMeasure(row.measure)}
				aria-label={`Toon terugkommaatregel voor ${row.studentName}`}
			>
				<StudentItem
					student={student}
					name={row.studentName}
					photoUrl={student?.links.foto?.href}
					classLabel={row.classCode}
					description={measureRowLabel(row)}
					variant="plain"
					className="min-w-0 flex-1 max-w-full"
				/>
				<ReturnMeasureStatusBadges reportStatus={row.reportStatus} planning={row.planning} />
			</button>
			<ReturnMeasureReportActions
				measure={row.measure}
				student={student}
				studentName={row.studentName}
				classLabel={row.classCode}
			/>
		</div>
	);
}

export default function ReturnMeasureRow({ row, student, onSelectMeasure }: ReturnMeasureRowProps) {
	const card = <ReturnMeasureRowCard row={row} student={student} onSelectMeasure={onSelectMeasure} />;
	if (!hasHandledTooltip(row.measure)) return card;

	return (
		<Tooltip>
			<TooltipTrigger asChild>{card}</TooltipTrigger>
			<TooltipContent>
				<ReturnMeasureHandledTooltipContent measure={row.measure} />
			</TooltipContent>
		</Tooltip>
	);
}
