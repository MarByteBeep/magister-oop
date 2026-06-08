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

export default function Occupancy() {
	const { students, currentLessonInfo } = useStudentsContext();
	const { todayKey, occupancyData, allLocations, hasData } = useOccupancyData(students);

	const [showLocationFilters, setShowLocationFilters] = useState(false);
	const [showChart, setShowChart] = useState(true);
	const chartIsDark = useChartDarkMode();
	const { isModalOpen, modalLocation, modalLessonRange, openModal, closeModal } = useOccupancyModal();

	const { selectedLocations, filteredLocations, handleLocationFilterChange, handleSelectAll, handleDeselectAll } =
		useOccupancyLocationSelection(allLocations);

	const chartData = useOccupancyChartData(filteredLocations, occupancyData, students, todayKey, allLocations);

	if (!hasData) {
		return (
			<p className="text-muted-foreground text-center py-4">Geen bezettingsgegevens beschikbaar voor vandaag.</p>
		);
	}

	return (
		<div className="space-y-0">
			<OccupancyToolbar
				showLocationFilters={showLocationFilters}
				showChart={showChart}
				selectedCount={selectedLocations.size}
				totalLocations={allLocations.length}
				onToggleFilters={() => setShowLocationFilters((v) => !v)}
				onToggleChart={() => setShowChart((v) => !v)}
			/>

			<OccupancyChartPanel
				show={showChart}
				chartData={chartData}
				currentLessonInfo={currentLessonInfo}
				chartIsDark={chartIsDark}
			/>

			<OccupancyFilters
				show={showLocationFilters}
				allLocations={allLocations}
				selectedLocations={selectedLocations}
				onLocationFilterChange={handleLocationFilterChange}
				onSelectAll={handleSelectAll}
				onDeselectAll={handleDeselectAll}
			/>

			<OccupancyLocationGrid
				filteredLocations={filteredLocations}
				occupancyData={occupancyData}
				currentLessonInfo={currentLessonInfo}
				onCardClick={openModal}
			/>

			{isModalOpen && (
				<OccupancyStudentsModal
					isOpen={isModalOpen}
					onClose={closeModal}
					locationCode={modalLocation}
					lessonRange={modalLessonRange}
					dateKey={todayKey}
				/>
			)}
		</div>
	);
}
