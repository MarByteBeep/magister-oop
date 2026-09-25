import { addSchoolDays, eachMonthKey, getDateKey, parseDateKey } from '@/lib/dateUtils';
import type { ReturnMeasureStudent, ScheduledReturnMeasure } from '@/magister/response/return-measure.types';

export type ReturnMeasureDisplay = {
	/** Name of the measure itself, e.g. "Uur nakomen". */
	measureLabel: string | null;
	/** Free text explaining why the measure was given. */
	description: string | null;
	hasMeasureLabel: boolean;
	hasDescription: boolean;
	hasBoth: boolean;
	primaryLabel: string;
};

function normalizeLabel(value: string | null | undefined): string | null {
	if (value == null) return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function getReturnMeasureDisplay(measure: ReturnMeasureStudent): ReturnMeasureDisplay {
	const measureLabel = normalizeLabel(measure.maatregel?.omschrijving);
	const description = normalizeLabel(measure.omschrijving);
	const hasMeasureLabel = measureLabel != null;
	const hasDescription = description != null;

	return {
		measureLabel,
		description,
		hasMeasureLabel,
		hasDescription,
		hasBoth: hasMeasureLabel && hasDescription,
		primaryLabel: measureLabel ?? description ?? '',
	};
}

export function isScheduledReturnMeasure(measure: ReturnMeasureStudent): measure is ScheduledReturnMeasure {
	return measure.begin != null && measure.einde != null;
}

/** Scheduled measures of one student that start within the inclusive local day range. */
export function scheduledReturnMeasuresForStudent(
	measures: ReturnMeasureStudent[],
	studentId: number,
	rangeStart: Date,
	rangeEnd: Date,
): ScheduledReturnMeasure[] {
	const startKey = getDateKey(rangeStart);
	const endKey = getDateKey(rangeEnd);

	return measures.filter(isScheduledReturnMeasure).filter((measure) => {
		if (measure.leerling.id !== studentId) return false;
		const dateKey = getDateKey(new Date(measure.begin));
		return dateKey >= startKey && dateKey <= endKey;
	});
}

/** Scheduled measures per student, keyed by the local day they start on. */
export function groupScheduledReturnMeasures(
	measures: ReturnMeasureStudent[],
): Map<number, Map<string, ScheduledReturnMeasure[]>> {
	const byStudent = new Map<number, Map<string, ScheduledReturnMeasure[]>>();

	for (const measure of measures) {
		if (!isScheduledReturnMeasure(measure)) continue;
		const byDate = byStudent.get(measure.leerling.id) ?? new Map<string, ScheduledReturnMeasure[]>();
		const dateKey = getDateKey(new Date(measure.begin));
		byDate.set(dateKey, [...(byDate.get(dateKey) ?? []), measure]);
		byStudent.set(measure.leerling.id, byDate);
	}

	return byStudent;
}

/** Month keys touched by an inclusive school-day return span (for cache invalidation and bulk refresh). */
export function returnMeasureSpanMonthKeys(startDateKey: string, dayCount: number): string[] {
	const start = parseDateKey(startDateKey);
	const end = addSchoolDays(start, Math.max(dayCount, 1));
	return eachMonthKey(start, end);
}
