'use client';

import ReturnMeasureReportActions from '@/components/return-measures/ReturnMeasureReportActions';
import ReturnMeasureStatusBadges from '@/components/return-measures/ReturnMeasureStatusBadges';
import StudentItem from '@/components/student/StudentItem';
import type { ReturnMeasureRow as Row } from '@/lib/return-measure/overview';
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

	return (
		<div className="flex w-full items-center justify-between gap-3 rounded-md border bg-muted/50 p-2">
			<button
				type="button"
				className="min-w-0 flex-1 cursor-pointer rounded-md text-left hover:bg-muted"
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
					className="w-full max-w-full"
				/>
			</button>
			<div className="flex items-center gap-2 shrink-0">
				<ReturnMeasureReportActions measure={row.measure} studentName={row.studentName} />
				<ReturnMeasureStatusBadges reportStatus={row.reportStatus} planning={row.planning} />
			</div>
		</div>
	);
}
