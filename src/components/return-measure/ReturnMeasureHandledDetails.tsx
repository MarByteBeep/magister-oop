'use client';

import { LuClock, LuUser } from 'react-icons/lu';
import { getReturnMeasureHandledInfo } from '@/lib/return-measure/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

export interface ReturnMeasureHandledDetailsProps {
	measure: ReturnMeasureStudent;
}

function hasHandledInfo(handledBy: string | null, handledAt: string | null): boolean {
	if (handledBy !== null) return true;
	return handledAt !== null;
}

function HandledByLine({ handledBy }: { handledBy: string | null }) {
	if (handledBy === null) return null;
	return (
		<p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
			<LuUser className="h-4 w-4 shrink-0" />
			<span>{handledBy}</span>
		</p>
	);
}

function HandledAtLine({ handledAt }: { handledAt: string | null }) {
	if (handledAt === null) return null;
	return (
		<p className="flex items-center gap-1.5 text-muted-foreground">
			<LuClock className="h-4 w-4 shrink-0" />
			<span>{handledAt}</span>
		</p>
	);
}

export default function ReturnMeasureHandledDetails({ measure }: ReturnMeasureHandledDetailsProps) {
	const { handledBy, handledAt } = getReturnMeasureHandledInfo(measure);
	if (!hasHandledInfo(handledBy, handledAt)) return null;

	return (
		<div className="rounded-md bg-muted/50 p-3 text-sm">
			<p className="font-medium text-foreground">Afgehandeld door</p>
			<HandledByLine handledBy={handledBy} />
			<HandledAtLine handledAt={handledAt} />
		</div>
	);
}
