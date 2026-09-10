'use client';

import { Badge } from '@/components/ui/badge';
import type { ReturnMeasurePlanning, ReturnMeasureReportStatus } from '@/lib/returnMeasureOverview';

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

interface ReturnMeasureStatusBadgesProps {
	reportStatus: ReturnMeasureReportStatus;
	planning: ReturnMeasurePlanning;
}

export default function ReturnMeasureStatusBadges({ reportStatus, planning }: ReturnMeasureStatusBadgesProps) {
	// A missing report is the norm until a measure is handled, so only say so afterwards.
	const showReportStatus = reportStatus !== 'none' || planning === 'handled';
	// "Gemeld" already implies the measure was handled.
	const showHandled = planning === 'handled' && reportStatus !== 'reported';

	if (!showHandled && !showReportStatus) return null;

	return (
		<div className="flex items-center gap-1 shrink-0">
			{showHandled && <Badge variant="outline">Afgehandeld</Badge>}
			{showReportStatus && <ReportStatusBadge status={reportStatus} />}
		</div>
	);
}
