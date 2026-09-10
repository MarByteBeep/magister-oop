'use client';

import { useEffect, useMemo, useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';
import ReturnMeasureDayList from '@/components/returnMeasures/ReturnMeasureDayList';
import ReturnMeasureFilters from '@/components/returnMeasures/ReturnMeasureFilters';
import { useReturnMeasuresContext } from '@/context/ReturnMeasuresContext';
import { useStudentsContext } from '@/context/StudentsContext';
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
import LoadingSpinner from './LoadingSpinner';
import StudentModal from './StudentModal';
import { Button } from './ui/button';

const EMPTY_MESSAGES: Record<ReturnMeasurePeriod, string> = {
	today: 'Geen terugkomers voor vandaag.',
	week: 'Geen terugkomers deze week.',
	month: 'Geen terugkomers deze maand.',
};

/**
 * The bulk list only holds the current month, while a week can run across the month boundary.
 * Those extra months come from the same month cache, so this is at most one extra call.
 */
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

export default function ReturnMeasures() {
	const { data, loading, refreshing, error, refresh } = useReturnMeasuresContext();
	const { students, selectedStudies } = useStudentsContext();
	const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
	const [period, setPeriod] = useState<ReturnMeasurePeriod>('today');
	const [status, setStatus] = useState<ReturnMeasureStatusFilter>('open');

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

	const selectedStudent = selectedStudentId == null ? undefined : studentById.get(selectedStudentId);

	if (loading) {
		return (
			<div className="py-10">
				<LoadingSpinner />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center gap-2 py-10">
				<p className="text-sm text-destructive">Fout bij laden terugkomers: {error}</p>
				<Button onClick={refresh}>Opnieuw proberen</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Terugkomers</h2>
				<Button
					variant="ghost"
					size="icon"
					onClick={refresh}
					disabled={refreshing}
					aria-label="Ververs terugkomers"
					title="Ververs"
				>
					<LuRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
				</Button>
			</div>

			<ReturnMeasureFilters
				period={period}
				status={status}
				counts={counts}
				onPeriodChange={setPeriod}
				onStatusChange={setStatus}
			/>

			<ReturnMeasureDayList
				groups={groups}
				studentById={studentById}
				emptyMessage={status === 'unplanned' ? 'Geen ongeplande terugkomers.' : EMPTY_MESSAGES[period]}
				onSelectStudent={setSelectedStudentId}
			/>

			{selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudentId(null)} />}
		</div>
	);
}
