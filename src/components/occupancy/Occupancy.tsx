'use client';

import { useState } from 'react';
import { useStudentsContext } from '@/context/StudentsContext';
import OccupancyChartPanel from './OccupancyChartPanel';
import OccupancyFilters from './OccupancyFilters';
import OccupancyLocationGrid from './OccupancyLocationGrid';
import OccupancyStudentsModal from './OccupancyStudentsModal';
import OccupancyToolbar from './OccupancyToolbar';
import { useChartDarkMode } from './useChartDarkMode';
import { useOccupancyChartData } from './useOccupancyChartData';
import { useOccupancyData } from './useOccupancyData';
import { useOccupancyLocationSelection } from './useOccupancyLocationSelection';
import { useOccupancyModal } from './useOccupancyModal';

function modalLocations(modalLocation: string | null, filteredLocations: string[]): string[] {
	if (modalLocation === null) return filteredLocations;
	return [modalLocation];
}

function modalInstanceKey(modalLessonRange: string, modalLocation: string | null): string {
	if (modalLocation === null) return `${modalLessonRange}-chart`;
	return `${modalLessonRange}-${modalLocation}`;
}

function OccupancyStudentsModalGate({
	isModalOpen,
	modalLessonRange,
	modalLocation,
	todayKey,
	filteredLocations,
	closeModal,
}: {
	isModalOpen: boolean;
	modalLessonRange: string;
	modalLocation: string | null;
	todayKey: string;
	filteredLocations: string[];
	closeModal: () => void;
}) {
	if (!isModalOpen) return null;

	return (
		<OccupancyStudentsModal
			key={modalInstanceKey(modalLessonRange, modalLocation)}
			isOpen={isModalOpen}
			onClose={closeModal}
			lessonRange={modalLessonRange}
			dateKey={todayKey}
			locations={modalLocations(modalLocation, filteredLocations)}
			showBreakStudents={modalLocation === null}
		/>
	);
}

function useOccupancyPageState() {
	const { students, currentLessonInfo } = useStudentsContext();
	const { todayKey, occupancyData, allLocations, hasData } = useOccupancyData(students);
	const [showLocationFilters, setShowLocationFilters] = useState(false);
	const [showChart, setShowChart] = useState(true);
	const chartIsDark = useChartDarkMode();
	const modal = useOccupancyModal();
	const selection = useOccupancyLocationSelection(allLocations);
	const chartData = useOccupancyChartData(selection.filteredLocations, occupancyData, students, todayKey);

	return {
		currentLessonInfo,
		todayKey,
		occupancyData,
		allLocations,
		hasData,
		showLocationFilters,
		showChart,
		chartIsDark,
		chartData,
		modal,
		selection,
		toggleFilters: () => setShowLocationFilters((v) => !v),
		toggleChart: () => setShowChart((v) => !v),
	};
}

function OccupancyContent() {
	const page = useOccupancyPageState();
	const { modal, selection } = page;

	return (
		<div className="space-y-0">
			<OccupancyToolbar
				showLocationFilters={page.showLocationFilters}
				showChart={page.showChart}
				selectedCount={selection.selectedLocations.size}
				totalLocations={page.allLocations.length}
				onToggleFilters={page.toggleFilters}
				onToggleChart={page.toggleChart}
			/>

			<OccupancyChartPanel
				show={page.showChart}
				chartData={page.chartData}
				currentLessonInfo={page.currentLessonInfo}
				chartIsDark={page.chartIsDark}
				onLessonRangeClick={modal.openChartModal}
			/>

			<OccupancyFilters
				show={page.showLocationFilters}
				allLocations={page.allLocations}
				selectedLocations={selection.selectedLocations}
				onLocationFilterChange={selection.handleLocationFilterChange}
				onSelectAll={selection.handleSelectAll}
				onDeselectAll={selection.handleDeselectAll}
			/>

			<OccupancyLocationGrid
				filteredLocations={selection.filteredLocations}
				occupancyData={page.occupancyData}
				currentLessonInfo={page.currentLessonInfo}
				onCardClick={modal.openLocationModal}
			/>

			<OccupancyStudentsModalGate
				isModalOpen={modal.isModalOpen}
				modalLessonRange={modal.modalLessonRange}
				modalLocation={modal.modalLocation}
				todayKey={page.todayKey}
				filteredLocations={selection.filteredLocations}
				closeModal={modal.closeModal}
			/>
		</div>
	);
}

export default function Occupancy() {
	const { students } = useStudentsContext();
	const { hasData } = useOccupancyData(students);

	if (!hasData) {
		return (
			<p className="text-muted-foreground text-center py-4">Geen bezettingsgegevens beschikbaar voor vandaag.</p>
		);
	}

	return <OccupancyContent />;
}
