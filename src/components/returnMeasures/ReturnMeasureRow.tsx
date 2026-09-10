'use client';

import LazyAvatar from '@/components/LazyAvatar';
import { Badge } from '@/components/ui/badge';
import { formatTime, parseOptionalDate } from '@/lib/dateUtils';
import type { ReturnMeasureReportStatus, ReturnMeasureRow as Row } from '@/lib/returnMeasureOverview';
import { getInitials } from '@/lib/stringUtils';
import type { Student } from '@/magister/types';

const REPORT_STATUS_LABELS: Record<ReturnMeasureReportStatus, string> = {
	reported: 'Gemeld',
	'not-reported': 'Niet gemeld',
	none: 'Geen melding',
};

function ReportStatusBadge({ status }: { status: ReturnMeasureReportStatus }) {
	if (status === 'not-reported') return <Badge variant="destructive">{REPORT_STATUS_LABELS[status]}</Badge>;
	if (status === 'reported') return <Badge variant="secondary">{REPORT_STATUS_LABELS[status]}</Badge>;
	return <Badge variant="outline">{REPORT_STATUS_LABELS[status]}</Badge>;
}

function formatTimeRange(row: Row): string | null {
	const start = parseOptionalDate(row.start);
	const end = parseOptionalDate(row.end);
	if (!start || !end) return null;
	return `${formatTime(start)} - ${formatTime(end)}`;
}

interface ReturnMeasureRowProps {
	row: Row;
	student?: Student;
	onSelectStudent: (studentId: number) => void;
}

export default function ReturnMeasureRow({ row, student, onSelectStudent }: ReturnMeasureRowProps) {
	const clickable = Boolean(student);
	const timeRange = formatTimeRange(row);
	// A missing report is the norm until a measure is handled, so only say so afterwards.
	const showReportStatus = row.reportStatus !== 'none' || row.planning === 'handled';
	// "Gemeld" already implies the measure was handled.
	const showHandled = row.planning === 'handled' && row.reportStatus !== 'reported';

	return (
		<button
			type="button"
			disabled={!clickable}
			className={[
				'flex items-center justify-between gap-3 p-2 border rounded-md bg-muted/50 text-left',
				clickable ? 'hover:bg-muted cursor-pointer' : 'opacity-60 cursor-not-allowed',
			].join(' ')}
			onClick={() => {
				if (student) onSelectStudent(student.id);
			}}
		>
			<div className="flex items-center gap-3 min-w-0">
				<LazyAvatar
					src={student?.links.foto?.href || undefined}
					alt={row.studentName}
					initials={getInitials(row.studentName)}
					className="h-10 w-10"
				/>
				<div className="flex flex-col min-w-0">
					<span className="font-medium text-foreground truncate">
						{row.studentName} <span className="text-muted-foreground">({row.classCode})</span>
					</span>
					<span className="text-xs text-muted-foreground truncate">
						{timeRange ? `${timeRange} · ` : ''}
						{row.primaryLabel}
						{row.secondaryLabel ? ` · ${row.secondaryLabel}` : ''}
					</span>
				</div>
			</div>
			<div className="flex items-center gap-1 shrink-0">
				{showHandled && <Badge variant="outline">Afgehandeld</Badge>}
				{showReportStatus && <ReportStatusBadge status={row.reportStatus} />}
			</div>
		</button>
	);
}
