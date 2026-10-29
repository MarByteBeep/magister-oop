'use client';

import { getReturnMeasureHandledInfo } from '@/lib/return-measure/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

export interface ReturnMeasureHandledTooltipContentProps {
	measure: ReturnMeasureStudent;
}

function hasHandledInfo(handledBy: string | null, handledAt: string | null): boolean {
	if (handledBy !== null) return true;
	return handledAt !== null;
}

function HandledByText({ handledBy }: { handledBy: string | null }) {
	if (handledBy === null) return null;
	return <div>{handledBy}</div>;
}

function HandledAtText({ handledAt }: { handledAt: string | null }) {
	if (handledAt === null) return null;
	return <div>{handledAt}</div>;
}

/** Compact handled-by summary for tooltips: bold title, then name and time. */
export default function ReturnMeasureHandledTooltipContent({ measure }: ReturnMeasureHandledTooltipContentProps) {
	const { handledBy, handledAt } = getReturnMeasureHandledInfo(measure);
	if (!hasHandledInfo(handledBy, handledAt)) return null;

	return (
		<div className="space-y-1">
			<div className="font-bold">Afgehandeld door</div>
			<HandledByText handledBy={handledBy} />
			<HandledAtText handledAt={handledAt} />
		</div>
	);
}
