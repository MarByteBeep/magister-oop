import { addDays, getDateKey, getMonthRange, getNow, getStartOfWeek } from '@/lib/dateUtils';
import { getReturnMeasureDisplay } from '@/lib/returnMeasureUtils';
import { formatPersonName } from '@/lib/stringUtils';
import type { StudentVisibility } from '@/lib/studentVisibility';
import type { ReturnMeasureStudent } from '@/magister/response/return-measure.types';

/** Whether the student reported for the measure; shown as a badge on every row. */
export type ReturnMeasureReportStatus = 'reported' | 'not-reported' | 'none';

/** Handling state, mirroring Magister's own status filter. */
export type ReturnMeasurePlanning = 'open' | 'handled' | 'unplanned';

export type ReturnMeasureStatusFilter = ReturnMeasurePlanning | 'all';

export type ReturnMeasurePeriod = 'today' | 'week' | 'month';

export type ReturnMeasureRow = {
	id: number;
	studentId: number;
	studentName: string;
	classCode: string;
	primaryLabel: string;
	secondaryLabel: string | null;
	/** Local day the measure is planned on; null when it has no slot yet. */
	dateKey: string | null;
	start: string | null;
	end: string | null;
	reportStatus: ReturnMeasureReportStatus;
	planning: ReturnMeasurePlanning;
	measure: ReturnMeasureStudent;
};

/** Days without a planned slot are grouped under a null key. */
export type ReturnMeasureDayGroup = {
	dateKey: string | null;
	rows: ReturnMeasureRow[];
};

export function returnMeasureReportStatus(measure: ReturnMeasureStudent): ReturnMeasureReportStatus {
	if (measure.heeftNietGemeld) return 'not-reported';
	if (measure.heeftGemeld) return 'reported';
	return 'none';
}

export function returnMeasurePlanning(measure: ReturnMeasureStudent): ReturnMeasurePlanning {
	if (measure.begin == null) return 'unplanned';
	return measure.afgehandeldOp == null ? 'open' : 'handled';
}

export function buildReturnMeasureRows(
	measures: ReturnMeasureStudent[],
	isVisible: StudentVisibility,
): ReturnMeasureRow[] {
	const rows: ReturnMeasureRow[] = [];

	for (const measure of measures) {
		const student = measure.leerling;
		if (!isVisible(student.id)) continue;

		const display = getReturnMeasureDisplay(measure);
		rows.push({
			id: measure.id,
			studentId: student.id,
			studentName: formatPersonName(student.roepnaam, student.tussenvoegsel, student.achternaam),
			classCode: student.stamklas.code,
			primaryLabel: display.primaryLabel,
			secondaryLabel: display.hasBoth ? display.description : null,
			dateKey: measure.begin == null ? null : getDateKey(new Date(measure.begin)),
			start: measure.begin,
			end: measure.einde,
			reportStatus: returnMeasureReportStatus(measure),
			planning: returnMeasurePlanning(measure),
			measure,
		});
	}

	return rows;
}

/** Inclusive local day range of a period, always inside the month that was fetched. */
export function returnMeasurePeriodRange(
	period: ReturnMeasurePeriod,
	now: Date = getNow(),
): { startKey: string; endKey: string } {
	if (period === 'today') {
		const today = getDateKey(now);
		return { startKey: today, endKey: today };
	}
	if (period === 'week') {
		const monday = getStartOfWeek(now);
		return { startKey: getDateKey(monday), endKey: getDateKey(addDays(monday, 6)) };
	}
	const { start, end } = getMonthRange(now);
	return { startKey: getDateKey(start), endKey: getDateKey(end) };
}

/**
 * The period only narrows planned measures: measures without a slot carry no date, so they
 * stay visible whenever the status filter admits them.
 */
export function filterReturnMeasureRows(
	rows: ReturnMeasureRow[],
	period: ReturnMeasurePeriod,
	status: ReturnMeasureStatusFilter,
	now: Date = getNow(),
): ReturnMeasureRow[] {
	const { startKey, endKey } = returnMeasurePeriodRange(period, now);

	return rows.filter((row) => {
		if (status !== 'all' && row.planning !== status) return false;
		if (row.dateKey == null) return true;
		return row.dateKey >= startKey && row.dateKey <= endKey;
	});
}

/** Badge count on the tab: today's measures that still need handling. */
export function countOpenReturnMeasuresToday(
	measures: ReturnMeasureStudent[],
	isVisible: StudentVisibility,
	now: Date = getNow(),
): number {
	const rows = buildReturnMeasureRows(measures, isVisible);
	return filterReturnMeasureRows(rows, 'today', 'open', now).length;
}

export function countReturnMeasureRowsByStatus(
	rows: ReturnMeasureRow[],
	period: ReturnMeasurePeriod,
	now: Date = getNow(),
): Record<ReturnMeasureStatusFilter, number> {
	return {
		open: filterReturnMeasureRows(rows, period, 'open', now).length,
		handled: filterReturnMeasureRows(rows, period, 'handled', now).length,
		unplanned: filterReturnMeasureRows(rows, period, 'unplanned', now).length,
		all: filterReturnMeasureRows(rows, period, 'all', now).length,
	};
}

/** Chronological day groups; measures without a slot come last. */
export function groupReturnMeasureRowsByDay(rows: ReturnMeasureRow[]): ReturnMeasureDayGroup[] {
	const byDate = new Map<string, ReturnMeasureRow[]>();
	const unplanned: ReturnMeasureRow[] = [];

	for (const row of rows) {
		if (row.dateKey == null) {
			unplanned.push(row);
			continue;
		}
		byDate.set(row.dateKey, [...(byDate.get(row.dateKey) ?? []), row]);
	}

	const groups: ReturnMeasureDayGroup[] = [...byDate.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([dateKey, dayRows]) => ({ dateKey, rows: sortRows(dayRows) }));

	if (unplanned.length > 0) groups.push({ dateKey: null, rows: sortRows(unplanned) });

	return groups;
}

function sortRows(rows: ReturnMeasureRow[]): ReturnMeasureRow[] {
	return [...rows].sort((a, b) => {
		const startA = a.start ?? '';
		const startB = b.start ?? '';
		if (startA !== startB) return startA.localeCompare(startB);
		return a.studentName.localeCompare(b.studentName);
	});
}
