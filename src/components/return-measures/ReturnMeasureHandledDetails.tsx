'use client';

import { LuClock, LuUser } from 'react-icons/lu';
import { getReturnMeasureHandledInfo } from '@/lib/return-measure/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

interface ReturnMeasureHandledDetailsProps {
	measure: ReturnMeasureStudent;
}

export default function ReturnMeasureHandledDetails({ measure }: ReturnMeasureHandledDetailsProps) {
	const { handledBy, handledAt } = getReturnMeasureHandledInfo(measure);
	if (handledBy == null && handledAt == null) return null;

	return (
		<div className="rounded-md bg-muted/50 p-3 text-sm">
			<p className="font-medium text-foreground">Afgehandeld door</p>
			{handledBy && (
				<p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
					<LuUser className="h-4 w-4 shrink-0" />
					<span>{handledBy}</span>
				</p>
			)}
			{handledAt && (
				<p className="flex items-center gap-1.5 text-muted-foreground">
					<LuClock className="h-4 w-4 shrink-0" />
					<span>{handledAt}</span>
				</p>
			)}
		</div>
	);
}
