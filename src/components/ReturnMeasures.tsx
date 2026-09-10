'use client';

import { useEffect, useMemo, useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';
import ReturnMeasureDayList from '@/components/returnMeasures/ReturnMeasureDayList';
import ReturnMeasureFilters from '@/components/returnMeasures/ReturnMeasureFilters';
import ReturnMeasureModal from '@/components/returnMeasures/ReturnMeasureModal';
import type { StudentDetailTab } from '@/components/student/StudentDetailContent';
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
	const [selectedMeasure, setSelectedMeasure] = useState<ReturnMeasureStudent | null>(null);
	const [studentTab, setStudentTab] = useState<StudentDetailTab>('gegevens');
	const [agendaDate, setAgendaDate] = useState<Date | undefined>(undefined);
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
			<div className="flex items-center justify-between gap-2">
				<ReturnMeasureFilters
					period={period}
					status={status}
					counts={counts}
					onPeriodChange={setPeriod}
					onStatusChange={setStatus}
				/>
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

			<ReturnMeasureDayList
				groups={groups}
				studentById={studentById}
				emptyMessage="Geen terugkomers."
				onSelectMeasure={setSelectedMeasure}
			/>

			{selectedMeasure && (
				<ReturnMeasureModal
					measure={selectedMeasure}
					isOpen={selectedMeasure !== null}
					onClose={() => setSelectedMeasure(null)}
					onOpenStudent={(opened, options) => {
						setStudentTab(options?.tab ?? 'gegevens');
						setAgendaDate(options?.date);
						setSelectedStudentId(opened.id);
						if (options?.tab === 'agenda') setSelectedMeasure(null);
					}}
				/>
			)}

			{selectedStudent && (
				<StudentModal
					student={selectedStudent}
					initialTab={studentTab}
					agendaDate={agendaDate}
					onClose={() => {
						setSelectedStudentId(null);
						setStudentTab('gegevens');
						setAgendaDate(undefined);
					}}
				/>
			)}
		</div>
	);
}
