'use client';

import { LuTriangleAlert } from 'react-icons/lu';
import ReturnMeasureHandledTooltipContent from '@/components/return-measures/ReturnMeasureHandledTooltipContent';
import { returnMeasureIconClasses } from '@/lib/agenda/kindStyles';
import { returnMeasureReportStatus } from '@/lib/return-measure/overview';
import { getReturnMeasureDisplay, getReturnMeasureHandledInfo } from '@/lib/return-measure/utils';
import { formatTime } from '@/lib/shared/dateUtils';
import { cn } from '@/lib/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

interface ReturnMeasureAgendaTooltipProps {
	measure: ReturnMeasureStudent;
	beginTime: Date;
	endTime: Date;
}

export default function ReturnMeasureAgendaTooltip({ measure, beginTime, endTime }: ReturnMeasureAgendaTooltipProps) {
	const display = getReturnMeasureDisplay(measure);
	const { handledBy, handledAt } = getReturnMeasureHandledInfo(measure);
	const reportStatus = returnMeasureReportStatus(measure);
	const reportLabel = reportStatus === 'reported' ? 'Gemeld' : reportStatus === 'not-reported' ? 'Niet gemeld' : null;
	const hasHandledInfo = handledBy != null || handledAt != null;

	return (
		<div className="space-y-1">
			{display.hasMeasureLabel && <div className="font-bold">{display.measureLabel}</div>}
			{display.hasDescription && (
				<div className={display.hasMeasureLabel ? undefined : 'font-bold'}>
					{display.hasBoth && (
						<LuTriangleAlert
							className={cn(
								'mr-1 inline h-3.5 w-3.5 shrink-0 align-[-0.125em]',
								returnMeasureIconClasses,
							)}
							aria-hidden
						/>
					)}
					{display.description}
				</div>
			)}
			<div>
				Tijd: {formatTime(beginTime)} - {formatTime(endTime)}
			</div>
			{reportLabel && <div>Status: {reportLabel}</div>}
			{hasHandledInfo && <ReturnMeasureHandledTooltipContent measure={measure} />}
		</div>
	);
}
