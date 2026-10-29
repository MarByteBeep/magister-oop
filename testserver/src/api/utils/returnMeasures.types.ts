import type { Measure } from '@/magister/response/returnMeasure.types';

export type StoredReturnMeasureTemplate = {
	id: number;
	/** Days from today; null for a measure that has no slot yet. */
	dayOffset: number | null;
	description: string;
	measure: Measure | null;
	startTime: string;
	endTime: string;
	/** Inclusive school-day span from the return start; defaults to 1 when omitted. */
	dayCount?: number;
	hasReported: boolean;
	hasNotReported: boolean;
	/** Local HH:mm on the measure's day, or null when it was never handled. */
	handledTime: string | null;
	handledById: number | null;
};
