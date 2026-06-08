'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LuChartLine, LuFilter } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStudentsContext } from '@/context/StudentsContext';
import { getTodayKey } from '@/lib/dateUtils';
import { getOccupancyForDay } from '@/lib/occupancyUtils';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import OccupancyChart from './OccupancyChart';
import OccupancyFilters from './OccupancyFilters';
import OccupancyStudentsModal from './OccupancyStudentsModal';
import { useOccupancyChartData } from './useOccupancyChartData';

const OCCUPANCY_LOCATIONS_STORAGE_KEY = 'occupancySelectedLocations';

export default function Occupancy() {
	const { students, currentLessonInfo } = useStudentsContext();
	const todayKey = getTodayKey();

	const occupancyData = useMemo(() => getOccupancyForDay(students, todayKey), [students, todayKey]);

	const allLocations = useMemo(() => Object.keys(occupancyData).sort(), [occupancyData]);

	const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
	const [initializedLocations, setInitializedLocations] = useState(false);
	const [showLocationFilters, setShowLocationFilters] = useState(false);
	const [showChart, setShowChart] = useState(true);
	const [chartIsDark, setChartIsDark] = useState(
		() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
	);

	useEffect(() => {
		const root = document.documentElement;
		const sync = () => setChartIsDark(root.classList.contains('dark'));
		sync();
		const observer = new MutationObserver(sync);
		observer.observe(root, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	}, []);

	// State for the student modal
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalLocation, setModalLocation] = useState('');
	const [modalLessonRange, setModalLessonRange] = useState('');

	/* ---------------- Local storage ---------------- */

	const hasInitialLoadFromStorage = useRef(false);
	useEffect(() => {
		if (hasInitialLoadFromStorage.current) return;
		// Wait until we have real location data, so "no selection yet" correctly defaults to all locations
		if (allLocations.length === 0) return;
		(async () => {
			const stored = await storage.local.get<string[]>(OCCUPANCY_LOCATIONS_STORAGE_KEY);
			// Only use "all locations" when key was never set (first load). Empty array [] is valid (user deselected all).
			const initialSelection = stored !== undefined && stored !== null ? new Set(stored) : new Set(allLocations);

			setSelectedLocations(initialSelection);
			setInitializedLocations(true);
			hasInitialLoadFromStorage.current = true;
		})();
	}, [allLocations]);

	useEffect(() => {
		if (!initializedLocations) return;
		void storage.local.set(OCCUPANCY_LOCATIONS_STORAGE_KEY, Array.from(selectedLocations));
	}, [selectedLocations, initializedLocations]);

	/* ---------------- Filtering ---------------- */

	const filteredLocations = useMemo(() => {
		// Before init: show all to avoid flash. After init: empty selection = no rooms (only show selected).
		if (!initializedLocations) return allLocations;
		return allLocations.filter((location) => selectedLocations.has(location));
	}, [allLocations, selectedLocations, initializedLocations]);

	const handleLocationFilterChange = (location: string, checked: boolean) => {
		setSelectedLocations((prev) => {
			const newSet = new Set(prev);
			checked ? newSet.add(location) : newSet.delete(location);
			return newSet;
		});
	};

	const handleSelectAll = () => setSelectedLocations(new Set(allLocations));
	const handleDeselectAll = () => setSelectedLocations(new Set());

	const chartData = useOccupancyChartData(filteredLocations, occupancyData, students, todayKey, allLocations);

	/* ---------------- Modal handlers ---------------- */
	const handleCardClick = (location: string, lessonRange: string) => {
		setModalLocation(location);
		setModalLessonRange(lessonRange);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setModalLocation('');
		setModalLessonRange('');
	};

	if (!occupancyData || Object.keys(occupancyData).length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">Geen bezettingsgegevens beschikbaar voor vandaag.</p>
		);
	}

	return (
		<div className="space-y-0">
			{/* -------- Buttons -------- */}
			<div className="flex justify-end gap-2 mb-4">
				<Button
					variant={showLocationFilters ? 'default' : 'outline'}
					size="icon"
					className="relative"
					onClick={() => setShowLocationFilters(!showLocationFilters)}
				>
					{selectedLocations.size > 0 && selectedLocations.size < allLocations.length && (
						<Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1">
							{selectedLocations.size}
						</Badge>
					)}
					<LuFilter className="h-4 w-4" />
				</Button>

				<Button
					variant={showChart ? 'default' : 'outline'}
					size="icon"
					onClick={() => setShowChart((prev) => !prev)}
				>
					<LuChartLine className="h-4 w-4" />
				</Button>
			</div>

			{/* -------- Chart -------- */}
			<div
				className={cn(
					'overflow-hidden transition-all duration-300',
					showChart ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0',
				)}
			>
				<OccupancyChart chartData={chartData} currentLessonInfo={currentLessonInfo} chartIsDark={chartIsDark} />
			</div>

			{/* -------- Location filters -------- */}
			<OccupancyFilters
				show={showLocationFilters}
				allLocations={allLocations}
				selectedLocations={selectedLocations}
				onLocationFilterChange={handleLocationFilterChange}
				onSelectAll={handleSelectAll}
				onDeselectAll={handleDeselectAll}
			/>

			{/* -------- Occupancy cards -------- */}
			{filteredLocations.length === 0 ? (
				<p className="text-muted-foreground text-sm py-4 text-center">
					Selecteer één of meer lokalen in het filter om de bezetting per ruimte te zien.
				</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{filteredLocations.map((location) => (
						<div key={location} className="border rounded-lg p-2 bg-card shadow-sm">
							<h3 className="text-md font-semibold mb-2">{location}</h3>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
								{Object.entries(occupancyData[location]).map(([lessonRange, count]) => {
									const isCurrentLesson = currentLessonInfo.range === lessonRange;
									const isFree = count === 0;

									return (
										<button
											type="button"
											key={`${location}-${lessonRange}`}
											className={cn(
												'p-1 rounded text-xs flex flex-col items-center justify-center cursor-pointer',
												isCurrentLesson && !isFree && 'bg-primary text-primary-foreground',
												isCurrentLesson && isFree && 'bg-green-600 text-primary-foreground',
												!isCurrentLesson &&
													isFree &&
													'bg-muted/50 text-muted-foreground/70 border border-dashed',
												!isCurrentLesson && !isFree && 'bg-primary/20 text-muted-foreground',
											)}
											onClick={() => handleCardClick(location, lessonRange)}
										>
											<span className="text-xs">{lessonRange}</span>
											<span className="font-medium text-sm">{isFree ? 'Vrij' : `${count}`}</span>
										</button>
									);
								})}
							</div>
						</div>
					))}
				</div>
			)}

			{isModalOpen && (
				<OccupancyStudentsModal
					isOpen={isModalOpen}
					onClose={handleCloseModal}
					locationCode={modalLocation}
					lessonRange={modalLessonRange}
					dateKey={todayKey}
				/>
			)}
		</div>
	);
}
