import { useEffect, useMemo, useState } from 'react';
import { eachMonthKey, getMonthKey, getNow, parseDateKey } from '@/lib/dateUtils';
import { getReturnMeasuresForMonth } from '@/lib/returnMeasureFetch';
import {
	buildReturnMeasureRows,
	countReturnMeasureRowsByStatus,
	filterReturnMeasureRows,
	groupReturnMeasureRowsByDay,
	type ReturnMeasurePeriod,
	type ReturnMeasureStatusFilter,
	returnMeasurePeriodRange,
} from '@/lib/returnMeasureOverview';
import { createStudentVisibility } from '@/lib/studentVisibility';
import type { ReturnMeasureStudent } from '@/magister/response/return-measure.types';
import type { Student } from '@/types/student.types';

function useNeighbourMonthMeasures(period: ReturnMeasurePeriod): ReturnMeasureStudent[] {
	const [measures, setMeasures] = useState<ReturnMeasureStudent[]>([]);

	useEffect(() => {
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
	}, [period]);

	return measures;
}

export function useReturnMeasureOverviewData(
	data: ReturnMeasureStudent[] | null | undefined,
	students: Student[],
	selectedStudies: Set<string>,
	period: ReturnMeasurePeriod,
	status: ReturnMeasureStatusFilter,
) {
	const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
	const neighbourMonthMeasures = useNeighbourMonthMeasures(period);

	const rows = useMemo(() => {
		const isVisible = createStudentVisibility(studentById, selectedStudies);
		return buildReturnMeasureRows([...(data ?? []), ...neighbourMonthMeasures], isVisible);
	}, [data, neighbourMonthMeasures, studentById, selectedStudies]);

	const counts = useMemo(() => countReturnMeasureRowsByStatus(rows, period), [rows, period]);
	const groups = useMemo(
		() => groupReturnMeasureRowsByDay(filterReturnMeasureRows(rows, period, status)),
		[rows, period, status],
	);

	return { studentById, counts, groups };
}
