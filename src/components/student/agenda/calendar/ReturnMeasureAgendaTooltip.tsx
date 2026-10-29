'use client';

import { LuTriangleAlert } from 'react-icons/lu';
import ReturnMeasureHandledTooltipContent from '@/components/return-measure/ReturnMeasureHandledTooltipContent';
import { returnMeasureIconClasses } from '@/lib/agenda/kindStyles';
import { type ReturnMeasureReportStatus, returnMeasureReportStatus } from '@/lib/return-measure/overview';
import type { ReturnMeasureDisplay } from '@/lib/return-measure/utils';
import { getReturnMeasureDisplay, getReturnMeasureHandledInfo } from '@/lib/return-measure/utils';
import { formatTime } from '@/lib/shared/dateUtils';
import { cn } from '@/lib/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

function reportStatusLabel(reportStatus: ReturnMeasureReportStatus): string | null {
	if (reportStatus === 'reported') return 'Gemeld';
	if (reportStatus === 'not-reported') return 'Niet gemeld';
	return null;
}

function hasHandledInfo(handledBy: string | null, handledAt: string | null): boolean {
	if (handledBy !== null) return true;
	return handledAt !== null;
}

function MeasureLabel({ label }: { label: string | null }) {
	if (!label) return null;
	return <div className="font-bold">{label}</div>;
}

function descriptionClassName(hasMeasureLabel: boolean): string | undefined {
	if (hasMeasureLabel) return undefined;
	return 'font-bold';
}

function OptionalBothWarning({ show }: { show: boolean }) {
	if (!show) return null;
	return (
		<LuTriangleAlert
			className={cn('mr-1 inline h-3.5 w-3.5 shrink-0 align-[-0.125em]', returnMeasureIconClasses)}
			aria-hidden
		/>
	);
}

function DescriptionBlock({ display }: { display: ReturnMeasureDisplay }) {
	if (!display.hasDescription) return null;
	return (
		<div className={descriptionClassName(display.hasMeasureLabel)}>
			<OptionalBothWarning show={display.hasBoth} />
			{display.description}
		</div>
	);
}

function ReturnMeasureAgendaTooltipDescription({ display }: { display: ReturnMeasureDisplay }) {
	return (
		<>
			<MeasureLabel label={display.measureLabel} />
			<DescriptionBlock display={display} />
		</>
	);
}

export interface ReturnMeasureAgendaTooltipProps {
	measure: ReturnMeasureStudent;
	beginTime: Date;
	endTime: Date;
}

function ReportStatusLine({ label }: { label: string | null }) {
	if (!label) return null;
	return <div>Status: {label}</div>;
}

function HandledInfoLine({ measure, show }: { measure: ReturnMeasureStudent; show: boolean }) {
	if (!show) return null;
	return <ReturnMeasureHandledTooltipContent measure={measure} />;
}

export default function ReturnMeasureAgendaTooltip({ measure, beginTime, endTime }: ReturnMeasureAgendaTooltipProps) {
	const display = getReturnMeasureDisplay(measure);
	const { handledBy, handledAt } = getReturnMeasureHandledInfo(measure);
	const reportLabel = reportStatusLabel(returnMeasureReportStatus(measure));

	return (
		<div className="space-y-1">
			<ReturnMeasureAgendaTooltipDescription display={display} />
			<div>
				Tijd: {formatTime(beginTime)} - {formatTime(endTime)}
			</div>
			<ReportStatusLine label={reportLabel} />
			<HandledInfoLine measure={measure} show={hasHandledInfo(handledBy, handledAt)} />
		</div>
	);
}
