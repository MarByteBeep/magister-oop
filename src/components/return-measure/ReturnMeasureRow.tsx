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
	if (!start || !end) return null;
	return `${formatTime(start)} - ${formatTime(end)}`;
}

interface ReturnMeasureRowProps {
	row: Row;
	student?: Student;
	onSelectMeasure: (measure: ReturnMeasureStudent) => void;
}

export default function ReturnMeasureRow({ row, student, onSelectMeasure }: ReturnMeasureRowProps) {
	const timeRange = formatTimeRange(row);
	const measureLabel =
		[timeRange, row.primaryLabel, row.secondaryLabel].filter(Boolean).join(' · ') || 'Terugkommaatregel';
	const { handledBy, handledAt } = getReturnMeasureHandledInfo(row.measure);
	const hasHandledTooltip = handledBy != null || handledAt != null;

	const card = (
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
					description={measureLabel}
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

	if (!hasHandledTooltip) return card;

	return (
		<Tooltip>
			<TooltipTrigger asChild>{card}</TooltipTrigger>
			<TooltipContent>
				<ReturnMeasureHandledTooltipContent measure={row.measure} />
			</TooltipContent>
		</Tooltip>
	);
}
