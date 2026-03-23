'use client';

import type { ApexOptions } from 'apexcharts';
import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'react-apexcharts';
import { LuChartLine, LuFilter } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useStudentsContext } from '@/context/StudentsContext';
import { getTodayKey } from '@/lib/dateUtils';
import { getOccupancyForDay } from '@/lib/occupancyUtils';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import OccupancyStudentsModal from './OccupancyStudentsModal'; // Import the new modal

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

	/* ---------------- Chart data ---------------- */

	const chartData = useMemo(() => {
		if (filteredLocations.length === 0) return [];

		const lessonRanges = Object.keys(occupancyData[filteredLocations[0]] ?? {});

		return lessonRanges.map((lessonRange) => {
			// Use Set to track unique student IDs for this lesson range across all filtered locations
			const uniqueStudentIds = new Set<number>();
			// Use Set to track unique student IDs who have a break (tussenuur) during this lesson range
			const uniqueBreakStudentIds = new Set<number>();

			const [lessonStart, lessonEnd] = lessonRange.split('-') as [string, string];

			// Iterate through all students to find unique ones in filtered locations for this lesson range
			for (const student of students) {
				const agendaForDay = student.agenda?.[todayKey];
				if (agendaForDay && agendaForDay.length > 0) {
					let hasLessonInThisRange = false;
					let hasLessonBefore = false;
					let hasLessonAfter = false;

					// Check all agenda items for this student
					for (const item of agendaForDay) {
						const itemStart = new Date(item.begin);
						const itemEnd = new Date(item.einde);

						const itemStartTime = `${String(itemStart.getHours()).padStart(2, '0')}:${String(itemStart.getMinutes()).padStart(2, '0')}`;
						const itemEndTime = `${String(itemEnd.getHours()).padStart(2, '0')}:${String(itemEnd.getMinutes()).padStart(2, '0')}`;

						// Check if the agenda item overlaps with the lesson range
						const overlaps =
							(itemStartTime < lessonEnd && itemEndTime > lessonStart) ||
							(itemStartTime === lessonStart && itemEndTime === lessonEnd);

						if (overlaps) {
							const itemLocations = item.locaties
								.map((loc) => (loc.code ?? loc.omschrijving)?.trim().toLowerCase())
								.filter((loc): loc is string => Boolean(loc));

							// Check if student is in any of the locations
							const isInFilteredLocation = itemLocations.some((loc) => allLocations.includes(loc));

							if (isInFilteredLocation) {
								hasLessonInThisRange = true;
								uniqueStudentIds.add(student.id);
							}
						}

						// Check if student has a lesson before this range (ends before or at lesson start)
						if (itemEndTime <= lessonStart) {
							hasLessonBefore = true;
						}

						// Check if student has a lesson after this range (starts after or at lesson end)
						if (itemStartTime >= lessonEnd) {
							hasLessonAfter = true;
						}
					}

					// A student has a break (tussenuur) if:
					// - They don't have a lesson in this range
					// - They have a lesson before this range (not before their first lesson)
					// - They have a lesson after this range (not after their last lesson)
					if (!hasLessonInThisRange && hasLessonBefore && hasLessonAfter) {
						uniqueBreakStudentIds.add(student.id);
					}
				}
			}

			return {
				lessonRange,
				total: uniqueStudentIds.size,
				breakTotal: uniqueBreakStudentIds.size,
			};
		});
	}, [filteredLocations, occupancyData, students, todayKey, allLocations]);

	/* ---------------- ApexCharts config ---------------- */

	// Find the index of the active lesson hour
	const activeLessonIndex = useMemo(() => {
		if (!currentLessonInfo.range || currentLessonInfo.status !== 'lesson') {
			return -1;
		}
		return chartData.findIndex((d) => d.lessonRange === currentLessonInfo.range);
	}, [chartData, currentLessonInfo]);

	const apexSeries = useMemo(() => {
		// For stacked bars, we use simple arrays of numbers
		// First series: students with lessons (bottom)
		const studentsData = chartData.map((d) => d.total);

		// Second series: students with breaks (stacked on top)
		const breaksData = chartData.map((d) => d.breakTotal);

		return [
			{
				name: 'Leerlingen',
				data: studentsData,
			},
			{
				name: 'Leerlingen met tussenuur',
				data: breaksData,
			},
		];
	}, [chartData]);

	const apexOptions: ApexOptions = useMemo(() => {
		const xLabelActive = chartIsDark ? '#fbbf24' : '#a16207';
		const xLabelDefault = chartIsDark ? '#e5e7eb' : '#4b5563';
		const gridBorder = chartIsDark ? '#374151' : '#e5e7eb';
		const nuLabelFg = chartIsDark ? '#fff' : '#1f2937';

		return {
			theme: {
				mode: chartIsDark ? 'dark' : 'light',
			},
			// FIX: fontWeight must be a single value, not an array (fix TS error)
			chart: {
				type: 'bar',
				stacked: true,
				toolbar: { show: false },
				zoom: { enabled: false },
				background: 'transparent',
				foreColor: chartIsDark ? '#e5e7eb' : '#374151',
				animations: {
					enabled: true,
					speed: 600,
				},
			},
			colors: ['#3b82f6', '#10b981'], // Blue for students, green for breaks
			xaxis: {
				categories: chartData.map((d) => d.lessonRange),
				labels: {
					style: {
						colors: chartData.map((_, index) =>
							index === activeLessonIndex ? xLabelActive : xLabelDefault,
						),
					},
				},
			},
			yaxis: {
				axisBorder: {
					show: true,
					color: gridBorder,
				},
				axisTicks: {
					show: true,
					color: gridBorder,
				},
				labels: {
					style: {
						colors: xLabelDefault,
					},
				},
			},
			grid: {
				show: true,
				borderColor: gridBorder,
			},
			legend: {
				labels: {
					colors: chartIsDark ? '#e5e7eb' : '#374151',
				},
			},
			annotations: {
				// ApexCharts expects annotations.images to exist; avoid undefined in library code
				images: [],
				...(activeLessonIndex >= 0 && {
					xaxis: [
						{
							x: chartData[activeLessonIndex]?.lessonRange,
							borderColor: 'transparent',
							strokeDashArray: 0,
							borderWidth: 0,
							label: {
								borderColor: '#fbbf24',
								style: {
									color: nuLabelFg,
									background: '#fbbf24',
									fontSize: '12px',
									fontWeight: 'bold',
								},
								text: 'Nu',
								orientation: 'horizontal',
								position: 'top',
								offsetY: -10,
							},
						},
					],
				}),
			},
		};
	}, [chartData, activeLessonIndex, chartIsDark]);

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
				<div className="border rounded-lg p-4 bg-card shadow-sm h-[350px]">
					<h3 className="text-sm font-medium mb-3 text-muted-foreground">
						Totaal aantal leerlingen per lesblok
					</h3>

					<Chart
						key={`chart-${activeLessonIndex}-${chartData.length}`}
						options={apexOptions}
						series={apexSeries}
						type="bar"
						height={280}
					/>
				</div>
			</div>

			{/* -------- Location filters -------- */}
			<div
				className={cn(
					'overflow-hidden transition-all duration-300',
					showLocationFilters ? 'max-h-screen opacity-100 mb-4' : 'max-h-0 opacity-0',
				)}
			>
				<div className="p-4 border rounded-md bg-card shadow-sm">
					<h3 className="text-sm font-medium mb-2">Lokalen filters</h3>

					<div className="flex gap-4 mb-4">
						<Button variant="outline" size="sm" onClick={handleSelectAll}>
							Alles selecteren
						</Button>
						<Button variant="outline" size="sm" onClick={handleDeselectAll}>
							Alles deselecteren
						</Button>
					</div>

					<div className="grid grid-cols-4 gap-2">
						{allLocations.map((location) => (
							<div key={location} className="flex items-center space-x-2">
								<Checkbox
									id={`location-${location}`}
									checked={selectedLocations.has(location)}
									onCheckedChange={(checked) =>
										handleLocationFilterChange(location, checked as boolean)
									}
								/>
								<label htmlFor={`location-${location}`} className="text-sm font-medium">
									{location}
								</label>
							</div>
						))}
					</div>
				</div>
			</div>

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
