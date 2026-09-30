import { useEffect, useMemo, useState } from 'react';
import { useReturnMeasureReportOverlays } from '@/hooks/return-measure/useReturnMeasureReportOverlays';
import { getReturnMeasuresForMonth } from '@/lib/return-measure/fetch';
import {
	buildReturnMeasureRows,
	countReturnMeasureRowsByStatus,
	filterReturnMeasureRows,
	groupReturnMeasureRowsByDay,
	type ReturnMeasurePeriod,
	type ReturnMeasureStatusFilter,
	returnMeasurePeriodRange,
} from '@/lib/return-measure/overview';
import { applyReturnMeasureReportOverlay } from '@/lib/return-measure/report';
import { eachMonthKey, getMonthKey, getNow, parseDateKey } from '@/lib/shared/dateUtils';
import { createStudentVisibility } from '@/lib/students/visibility';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

function useNeighbourMonthMeasures(period: ReturnMeasurePeriod, refreshing: boolean): ReturnMeasureStudent[] {
	const [measures, setMeasures] = useState<ReturnMeasureStudent[]>([]);

	useEffect(() => {
		if (refreshing) return;

		const { startKey, endKey } = returnMeasurePeriodRange(period);
		const currentMonth = getMonthKey(getNow());
		const neighbours = eachMonthKey(parseDateKey(startKey), parseDateKey(endKey)).filter(
			(monthKey) => monthKey !== currentMonth,
		);

		if (neighbours.length === 0) {
			setMeasures([]);
			return;
		}

		let active = true;
		void Promise.all(neighbours.map(getReturnMeasuresForMonth)).then((months) => {
			if (active) setMeasures(months.flat());
		});
		return () => {
			active = false;
		};
	}, [period, refreshing]);

	return measures;
}

export function useReturnMeasureOverviewData(
	data: ReturnMeasureStudent[] | null | undefined,
	students: Student[],
	selectedStudies: Set<string>,
	period: ReturnMeasurePeriod,
	status: ReturnMeasureStatusFilter,
	refreshing: boolean,
) {
	const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
	const neighbourMonthMeasures = useNeighbourMonthMeasures(period, refreshing);
	const reportOverlays = useReturnMeasureReportOverlays();

	const rows = useMemo(() => {
		const isVisible = createStudentVisibility(studentById, selectedStudies);
		const measures = [...(data ?? []), ...neighbourMonthMeasures].map((measure) =>
			applyReturnMeasureReportOverlay(measure, reportOverlays),
		);
		return buildReturnMeasureRows(measures, isVisible);
	}, [data, neighbourMonthMeasures, studentById, selectedStudies, reportOverlays]);

	const counts = useMemo(() => countReturnMeasureRowsByStatus(rows, period), [rows, period]);
	const groups = useMemo(
		() => groupReturnMeasureRowsByDay(filterReturnMeasureRows(rows, period, status)),
		[rows, period, status],
	);
	const measureById = useMemo(() => new Map(rows.map((row) => [row.id, row.measure])), [rows]);

	return { studentById, counts, groups, measureById };
}
