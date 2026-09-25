'use client';

import ReturnMeasureStatusBadges from '@/components/returnMeasures/ReturnMeasureStatusBadges';
import StudentItem from '@/components/student/StudentItem';
import { formatTime, parseOptionalDate } from '@/lib/dateUtils';
import type { ReturnMeasureRow as Row } from '@/lib/returnMeasureOverview';
import type { ReturnMeasureStudent } from '@/magister/response/return-measure.types';
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
		<button
			type="button"
			className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border bg-muted/50 p-2 text-left hover:bg-muted"
			onClick={() => onSelectMeasure(row.measure)}
			aria-label={`Toon terugkommaatregel voor ${row.studentName}`}
		>
			<div className="min-w-0 flex-1">
				<StudentItem
					student={student}
					name={row.studentName}
					photoUrl={student?.links.foto?.href}
					classLabel={row.classCode}
					description={measureLabel}
					variant="plain"
					className="w-full max-w-full"
				/>
			</div>
			<ReturnMeasureStatusBadges reportStatus={row.reportStatus} planning={row.planning} />
		</button>
	);
}
