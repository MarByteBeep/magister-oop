'use client';

import { getReturnMeasureHandledInfo } from '@/lib/return-measure/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

interface ReturnMeasureHandledTooltipContentProps {
	measure: ReturnMeasureStudent;
}

/** Compact handled-by summary for tooltips: bold title, then name and time. */
export default function ReturnMeasureHandledTooltipContent({ measure }: ReturnMeasureHandledTooltipContentProps) {
	const { handledBy, handledAt } = getReturnMeasureHandledInfo(measure);
	if (handledBy == null && handledAt == null) return null;

	return (
		<div className="space-y-1">
			<div className="font-bold">Afgehandeld door</div>
			{handledBy && <div>{handledBy}</div>}
			{handledAt && <div>{handledAt}</div>}
		</div>
	);
}
