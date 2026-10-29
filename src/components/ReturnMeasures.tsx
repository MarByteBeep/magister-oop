'use client';

import { useState } from 'react';
import { asyncFetchStatus } from '@/components/AsyncFetchStatus';
import ReturnMeasureDayList from '@/components/return-measure/ReturnMeasureDayList';
import ReturnMeasureFilters from '@/components/return-measure/ReturnMeasureFilters';
import ReturnMeasuresDialogs from '@/components/return-measure/ReturnMeasuresDialogs';
import SyncButton from '@/components/SyncButton';
import type { StudentDetailTab } from '@/components/student/profile/StudentDetailContent';
import { useReturnMeasuresContext } from '@/context/ReturnMeasuresContext';
import { useStudentsContext } from '@/context/StudentsContext';
import { useReturnMeasureOverviewData } from '@/hooks/return-measure/useReturnMeasureOverviewData';
import type { ReturnMeasurePeriod, ReturnMeasureStatusFilter } from '@/lib/return-measure/overview';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

type OpenStudentOptions = { tab?: StudentDetailTab; date?: Date };

function lookupStudent(studentById: Map<number, Student>, selectedStudentId: number | null) {
	if (selectedStudentId === null) return undefined;
	return studentById.get(selectedStudentId);
}

function lookupMeasure(measureById: Map<number, ReturnMeasureStudent>, selectedMeasureId: number | null) {
	if (selectedMeasureId === null) return null;
	const measure = measureById.get(selectedMeasureId);
	if (measure === undefined) return null;
	return measure;
}

function openStudentTab(options?: OpenStudentOptions): StudentDetailTab {
	if (options?.tab) return options.tab;
	return 'gegevens';
}

function shouldCloseMeasureOnAgenda(options?: OpenStudentOptions): boolean {
	return options?.tab === 'agenda';
}

function useReturnMeasuresSelection() {
	const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
	const [selectedMeasureId, setSelectedMeasureId] = useState<number | null>(null);
	const [studentTab, setStudentTab] = useState<StudentDetailTab>('gegevens');
	const [agendaDate, setAgendaDate] = useState<Date | undefined>(undefined);

	const openStudentFromMeasure = (opened: Student, options?: OpenStudentOptions) => {
		setStudentTab(openStudentTab(options));
		setAgendaDate(options?.date);
		setSelectedStudentId(opened.id);
		if (shouldCloseMeasureOnAgenda(options)) setSelectedMeasureId(null);
	};

	const closeStudent = () => {
		setSelectedStudentId(null);
		setStudentTab('gegevens');
		setAgendaDate(undefined);
	};

	return {
		selectedStudentId,
		selectedMeasureId,
		studentTab,
		agendaDate,
		setSelectedMeasureId,
		openStudentFromMeasure,
		closeStudent,
	};
}

function useReturnMeasuresFilters() {
	const [period, setPeriod] = useState<ReturnMeasurePeriod>('today');
	const [status, setStatus] = useState<ReturnMeasureStatusFilter>('open');
	return { period, setPeriod, status, setStatus };
}

function useReturnMeasuresPageState() {
	const { data, loading, refreshing, error, refresh } = useReturnMeasuresContext();
	const { students, selectedStudies } = useStudentsContext();
	const selection = useReturnMeasuresSelection();
	const filters = useReturnMeasuresFilters();

	const { studentById, counts, groups, measureById } = useReturnMeasureOverviewData(
		data,
		students,
		selectedStudies,
		filters.period,
		filters.status,
		refreshing,
	);

	return {
		loading,
		refreshing,
		error,
		refresh,
		counts,
		groups,
		studentById,
		measureById,
		filters,
		selection,
	};
}

export default function ReturnMeasures() {
	const page = useReturnMeasuresPageState();
	const { selection, filters } = page;

	const fetchStatus = asyncFetchStatus({
		loading: page.loading,
		error: page.error,
		errorMessage: 'Fout bij laden terugkomers',
		onRetry: page.refresh,
	});
	if (fetchStatus) return fetchStatus;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between gap-2">
				<ReturnMeasureFilters
					period={filters.period}
					status={filters.status}
					counts={page.counts}
					onPeriodChange={filters.setPeriod}
					onStatusChange={filters.setStatus}
				/>
				<SyncButton
					kind="plain"
					label="Ververs terugkomers"
					busy={page.refreshing}
					toast="Terugkomers gesynchroniseerd"
					errorToast="Terugkomers synchroniseren mislukt"
					onSync={page.refresh}
				/>
			</div>

			<ReturnMeasureDayList
				groups={page.groups}
				studentById={page.studentById}
				emptyMessage="Geen terugkomers."
				onSelectMeasure={(measure) => selection.setSelectedMeasureId(measure.id)}
			/>

			<ReturnMeasuresDialogs
				selectedMeasure={lookupMeasure(page.measureById, selection.selectedMeasureId)}
				selectedStudent={lookupStudent(page.studentById, selection.selectedStudentId)}
				studentTab={selection.studentTab}
				agendaDate={selection.agendaDate}
				onCloseMeasure={() => selection.setSelectedMeasureId(null)}
				onOpenStudentFromMeasure={selection.openStudentFromMeasure}
				onCloseStudent={selection.closeStudent}
			/>
		</div>
	);
}
