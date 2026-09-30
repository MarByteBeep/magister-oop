'use client';

import { useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';
import { asyncFetchStatus } from '@/components/AsyncFetchStatus';
import ReturnMeasureDayList from '@/components/return-measures/ReturnMeasureDayList';
import ReturnMeasureFilters from '@/components/return-measures/ReturnMeasureFilters';
import ReturnMeasuresDialogs from '@/components/return-measures/ReturnMeasuresDialogs';
import type { StudentDetailTab } from '@/components/student/profile/StudentDetailContent';
import { useReturnMeasuresContext } from '@/context/ReturnMeasuresContext';
import { useStudentsContext } from '@/context/StudentsContext';
import { useReturnMeasureOverviewData } from '@/hooks/return-measure/useReturnMeasureOverviewData';
import type { ReturnMeasurePeriod, ReturnMeasureStatusFilter } from '@/lib/return-measure/overview';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import { Button } from './ui/button';

export default function ReturnMeasures() {
	const { data, loading, refreshing, error, refresh } = useReturnMeasuresContext();
	const { students, selectedStudies } = useStudentsContext();
	const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
	const [selectedMeasure, setSelectedMeasure] = useState<ReturnMeasureStudent | null>(null);
	const [studentTab, setStudentTab] = useState<StudentDetailTab>('gegevens');
	const [agendaDate, setAgendaDate] = useState<Date | undefined>(undefined);
	const [period, setPeriod] = useState<ReturnMeasurePeriod>('today');
	const [status, setStatus] = useState<ReturnMeasureStatusFilter>('open');

	const { studentById, counts, groups } = useReturnMeasureOverviewData(
		data,
		students,
		selectedStudies,
		period,
		status,
	);

	const selectedStudent = selectedStudentId == null ? undefined : studentById.get(selectedStudentId);

	const fetchStatus = asyncFetchStatus({
		loading,
		error,
		errorMessage: 'Fout bij laden terugkomers',
		onRetry: refresh,
	});
	if (fetchStatus) return fetchStatus;

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

			<ReturnMeasuresDialogs
				selectedMeasure={selectedMeasure}
				selectedStudent={selectedStudent}
				studentTab={studentTab}
				agendaDate={agendaDate}
				onCloseMeasure={() => setSelectedMeasure(null)}
				onOpenStudentFromMeasure={(opened, options) => {
					setStudentTab(options?.tab ?? 'gegevens');
					setAgendaDate(options?.date);
					setSelectedStudentId(opened.id);
					if (options?.tab === 'agenda') setSelectedMeasure(null);
				}}
				onCloseStudent={() => {
					setSelectedStudentId(null);
					setStudentTab('gegevens');
					setAgendaDate(undefined);
				}}
			/>
		</div>
	);
}
