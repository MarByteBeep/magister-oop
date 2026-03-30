'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import LessonHourBadge from '@/components/LessonHourBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useStudentsContext } from '@/context/StudentsContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { findAgendaItem, getAgendaItemInfo, timeTable } from '@/lib/agendaUtils';
import { formatTime, getDateKey, getDayNameShort, getNow, getStartOfWeek, getWeekDays } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import AgendaItemModal from './AgendaItemModal';
import AgendaSyncButton from './AgendaSyncButton';
import AgendaTooltipContent from './AgendaTooltipContent';

interface WeeklyAgendaViewProps {
	studentId: number;
}

// Dynamically determine display start and end hours from timeTable
const firstLessonTime = timeTable[0].begin;
const lastLessonTime = timeTable[timeTable.length - 1].einde;

const DISPLAY_START_HOUR = Number.parseInt(firstLessonTime.split(':')[0], 10);
const DISPLAY_END_HOUR = Number.parseInt(lastLessonTime.split(':')[0], 10);

const TOTAL_DISPLAY_MINUTES = (DISPLAY_END_HOUR - DISPLAY_START_HOUR) * 60;
const SCHEDULE_HEIGHT_PX = 420;
const PIXELS_PER_MINUTE = SCHEDULE_HEIGHT_PX / TOTAL_DISPLAY_MINUTES;

const WEEKDAYS = ['ma', 'di', 'wo', 'do', 'vr'];

export default function WeeklyAgendaView({ studentId }: WeeklyAgendaViewProps) {
	const currentTime = useCurrentTime();
	const { students, loadAgendaForStudent } = useStudentsContext();
	const student = students.find((s) => s.id === studentId);

	const [isLoading, setIsLoading] = useState(false);
	const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);

	const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, 1 = next week
	const hasLoadedRef = useRef<Set<string>>(new Set()); // Track which weeks we've already fetched
	const nowLineRef = useRef<HTMLDivElement | null>(null);
	const hasScrolledToNowRef = useRef(false);

	// Use refs to access current values without triggering effect re-runs
	const studentRef = useRef(student);
	studentRef.current = student;

	const loadAgendaRef = useRef(loadAgendaForStudent);
	loadAgendaRef.current = loadAgendaForStudent;

	// Calculate the reference date for the selected week
	const selectedWeekDate = useMemo(() => {
		const now = getNow();
		const date = new Date(now);
		date.setDate(date.getDate() + weekOffset * 7);
		return date;
	}, [weekOffset]);

	// Week key for tracking loads
	const weekKey = useMemo(() => getDateKey(getStartOfWeek(selectedWeekDate)), [selectedWeekDate]);

	const syncRange = useMemo(() => {
		const monday = getStartOfWeek(selectedWeekDate);
		const friday = new Date(monday);
		friday.setDate(monday.getDate() + 4);
		return { start: monday, end: friday };
	}, [selectedWeekDate]);

	// Calculate week days for the selected week
	const weekDays = useMemo(() => {
		const days = getWeekDays(selectedWeekDate);
		return days;
	}, [selectedWeekDate]);
	const todayKey = useMemo(() => {
		const now = getNow();
		const key = getDateKey(now);
		return key;
	}, []);

	// Check if we're viewing the current week
	const isCurrentWeek = weekOffset === 0;

	// Navigation handlers
	const goToPreviousWeek = () => setWeekOffset((prev) => prev - 1);
	const goToNextWeek = () => setWeekOffset((prev) => prev + 1);
	const goToCurrentWeek = () => setWeekOffset(0);

	// Derive weekAgenda from student.agenda using useMemo (no state needed)
	const weekAgenda = useMemo(() => {
		const agenda: Record<string, AgendaItem[]> = {};
		for (const day of weekDays) {
			const dayKey = getDateKey(day);
			agenda[dayKey] = student?.agenda?.[dayKey] || [];
		}
		return agenda;
	}, [student?.agenda, weekDays]);

	// Load agenda for the whole week - only runs when weekKey or studentId changes
	useEffect(() => {
		// Already loaded this week for this student? Skip.
		const loadKey = `${studentId}-${weekKey}`;
		if (hasLoadedRef.current.has(loadKey)) {
			setIsLoading(false);
			return;
		}

		const currentStudent = studentRef.current;
		if (!currentStudent) {
			setIsLoading(false);
			return;
		}

		// Check if data already exists
		const dataExists = weekDays.every((day) => {
			const dayKey = getDateKey(day);
			return currentStudent.agenda?.[dayKey] !== undefined;
		});

		if (dataExists) {
			hasLoadedRef.current.add(loadKey);
			setIsLoading(false);
			return;
		}

		const monday = getStartOfWeek(selectedWeekDate);
		const friday = new Date(monday);
		friday.setDate(monday.getDate() + 4);

		hasLoadedRef.current.add(loadKey);
		setIsLoading(true);

		loadAgendaRef
			.current(currentStudent.id, monday, friday)
			.catch((err) => console.error('Failed to load week agenda:', err))
			.finally(() => setIsLoading(false));
	}, [studentId, weekKey, selectedWeekDate, weekDays]);

	// Current time indicator position (pixels from top) - only show on current week
	const currentTimePosition = useMemo(() => {
		if (!isCurrentWeek) return null;

		const now = currentTime;
		const currentMinutes = now.getHours() * 60 + now.getMinutes();
		const displayStartMinutes = DISPLAY_START_HOUR * 60;
		const displayEndMinutes = DISPLAY_END_HOUR * 60;

		if (currentMinutes < displayStartMinutes || currentMinutes > displayEndMinutes) {
			return null;
		}

		return (currentMinutes - displayStartMinutes) * PIXELS_PER_MINUTE;
	}, [currentTime, isCurrentWeek]);

	// On open: scroll so the 'now' line is visible (once per view)
	useEffect(() => {
		if (currentTimePosition === null || hasScrolledToNowRef.current) return;
		const el = nowLineRef.current;
		if (!el) return;
		hasScrolledToNowRef.current = true;
		el.scrollIntoView({ block: 'center', behavior: 'smooth' });
	}, [currentTimePosition]);

	// Find current agenda item for today
	const activeAgendaItem = useMemo(() => {
		const todayItems = weekAgenda[todayKey] || [];
		return findAgendaItem(currentTime, todayItems);
	}, [weekAgenda, todayKey, currentTime]);

	const hourlySlots = useMemo(
		() =>
			Array.from({ length: DISPLAY_END_HOUR - DISPLAY_START_HOUR + 1 }, (_, i) => {
				const hour = DISPLAY_START_HOUR + i;
				return `${String(hour).padStart(2, '0')}:00`;
			}),
		[],
	);

	const calculateItemStyle = (item: AgendaItem) => {
		const itemStart = new Date(item.begin);
		const itemEnd = new Date(item.einde);

		const startMinutes = itemStart.getHours() * 60 + itemStart.getMinutes();
		const endMinutes = itemEnd.getHours() * 60 + itemEnd.getMinutes();
		const displayStartMinutes = DISPLAY_START_HOUR * 60;

		const top = (startMinutes - displayStartMinutes) * PIXELS_PER_MINUTE;
		const height = (endMinutes - startMinutes) * PIXELS_PER_MINUTE;

		return {
			top: `${top}px`,
			height: `${height}px`,
		};
	};

	// Get week range for display
	const weekRangeText = useMemo(() => {
		if (weekDays.length === 0) return '';
		const firstDay = weekDays[0];
		const lastDay = weekDays[weekDays.length - 1];
		const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
		const dayNames = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

		const firstDayName = dayNames[firstDay.getDay()];
		const lastDayName = dayNames[lastDay.getDay()];

		if (firstDay.getMonth() === lastDay.getMonth()) {
			return `${firstDayName} ${firstDay.getDate()} - ${lastDayName} ${lastDay.getDate()} ${months[firstDay.getMonth()]} ${firstDay.getFullYear()}`;
		}
		return `${firstDayName} ${firstDay.getDate()} ${months[firstDay.getMonth()]} - ${lastDayName} ${lastDay.getDate()} ${months[lastDay.getMonth()]} ${lastDay.getFullYear()}`;
	}, [weekDays]);

	if (isLoading) {
		return (
			<div className="space-y-2 p-5">
				{/* Navigation skeleton */}
				<div className="flex items-center justify-between mb-2">
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-8 w-8" />
				</div>
				<div className="flex gap-2">
					{WEEKDAYS.map((day) => (
						<Skeleton key={day} className="h-8 flex-1" />
					))}
				</div>
				<div className="flex gap-2">
					{WEEKDAYS.map((day) => (
						<Skeleton key={`content-${day}`} className="h-[400px] flex-1" />
					))}
				</div>
			</div>
		);
	}

	const hasAnyItems = Object.values(weekAgenda).some((items) => items.length > 0);

	return (
		<>
			<div className="flex flex-col h-[520px]">
				{/* Navigation header */}
				<div className="flex items-center justify-between px-2 py-1 border-b shrink-0">
					<Button variant="ghost" size="icon" onClick={goToPreviousWeek} title="Vorige week">
						<LuChevronLeft className="h-5 w-5" />
					</Button>

					<div className="flex items-center gap-2">
						<span className="text-sm font-medium">{weekRangeText}</span>
						{!isCurrentWeek && (
							<Button variant="outline" size="sm" onClick={goToCurrentWeek} className="text-xs h-7">
								Vandaag
							</Button>
						)}
					</div>

					<div className="flex items-center gap-0.5 shrink-0">
						<AgendaSyncButton
							studentId={studentId}
							rangeStart={syncRange.start}
							rangeEnd={syncRange.end}
							tooltipReady="Vernieuw rooster voor deze week"
							tooltipLoading="Rooster wordt geladen…"
						/>
						<Button variant="ghost" size="icon" onClick={goToNextWeek} title="Volgende week">
							<LuChevronRight className="h-5 w-5" />
						</Button>
					</div>
				</div>

				{!hasAnyItems ? (
					<p className="text-muted-foreground text-center py-4">Geen lessen gepland voor deze week.</p>
				) : (
					<ScrollArea className="flex-1">
						<div className="flex flex-col">
							{/* Header row with day names */}
							<div className="flex sticky top-0 bg-background z-10 border-b">
								{/* Empty cell for time column */}
								<div className="w-14 shrink-0" />

								{/* Day headers */}
								{weekDays.map((day) => {
									const dayKey = getDateKey(day);
									const isToday = isCurrentWeek && dayKey === todayKey;
									const dayName = getDayNameShort(day);
									const dayNumber = day.getDate();

									return (
										<div
											key={dayKey}
											className={cn(
												'flex-1 text-center py-2 font-medium border-l text-sm',
												isToday && 'bg-primary/10',
											)}
										>
											<span className="text-muted-foreground uppercase">{dayName}</span>
											{isToday ? (
												<span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
													{dayNumber}
												</span>
											) : (
												<span className="ml-1">{dayNumber}</span>
											)}
										</div>
									);
								})}
							</div>

							{/* Time grid */}
							<div className="flex relative" style={{ height: `${SCHEDULE_HEIGHT_PX}px` }}>
								{/* Hour labels column */}
								<div className="w-14 shrink-0 text-right pr-2 text-xs text-muted-foreground">
									{hourlySlots.map((time, index) => (
										<div
											key={time}
											className="relative"
											style={{
												height:
													index < hourlySlots.length - 1
														? `${60 * PIXELS_PER_MINUTE}px`
														: 'auto',
											}}
										>
											{time}
										</div>
									))}
								</div>

								{/* Day columns */}
								{weekDays.map((day) => {
									const dayKey = getDateKey(day);
									const isToday = isCurrentWeek && dayKey === todayKey;
									const dayItems = weekAgenda[dayKey] || [];
									const sortedItems = [...dayItems].sort(
										(a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime(),
									);

									return (
										<div
											key={dayKey}
											className={cn('flex-1 relative border-l', isToday && 'bg-primary/5')}
										>
											{/* Horizontal grid lines */}
											{Array.from({ length: TOTAL_DISPLAY_MINUTES / 30 }, (_, i) => {
												const minutesOffset = (i + 1) * 30;
												const topPosition = minutesOffset * PIXELS_PER_MINUTE;
												const isFullHour = minutesOffset % 60 === 0;

												return (
													<div
														key={`grid-${dayKey}-${minutesOffset}`}
														className={cn(
															'absolute left-0 right-0 border-t border-border/30',
															isFullHour ? '' : 'border-dashed',
														)}
														style={{ top: `${topPosition}px` }}
													/>
												);
											})}

											{/* Current time indicator - only on today's column */}
											{isToday && currentTimePosition !== null && (
												<div
													ref={nowLineRef}
													className="absolute left-0 right-0 h-0.5 bg-yellow-500 z-20 pointer-events-none"
													style={{ top: `${currentTimePosition}px` }}
												/>
											)}

											{/* Agenda items */}
											{sortedItems.map((item) => {
												const isCurrent = isToday && activeAgendaItem?.id === item.id;
												const beginTime = new Date(item.begin);
												const endTime = new Date(item.einde);
												const itemStyle = calculateItemStyle(item);
												const { locations, courseDescriptions, subject, teachersCodes } =
													getAgendaItemInfo(item);

												// Build second line: time, location, teacher(s)
												const secondLineParts = [
													`${formatTime(beginTime)}-${formatTime(endTime)}`,
													locations,
													teachersCodes,
												].filter(Boolean);

												return (
													<Tooltip key={item.id}>
														<TooltipTrigger asChild>
															<button
																type="button"
																className={cn(
																	'absolute left-0.5 right-0.5 px-1 py-0.5 rounded-md border overflow-hidden cursor-pointer text-xs',
																	isCurrent
																		? 'bg-card-foreground/30 border-primary z-10'
																		: 'bg-card border-primary/50',
																)}
																style={itemStyle}
																onClick={() => setSelectedItem(item)}
															>
																{isCurrent && (
																	<Badge
																		variant="default"
																		className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[0.6rem] px-1 py-0"
																	>
																		Nu
																	</Badge>
																)}
																<div className="flex flex-col gap-0.5 items-start">
																	<div className="flex items-center gap-0.5">
																		{item.lesuur?.begin && (
																			<LessonHourBadge
																				lessonInfo={{
																					status: 'lesson',
																					lesson: item.lesuur.begin,
																				}}
																				className="h-3.5 w-3.5 text-[0.5rem]"
																			/>
																		)}
																		<span className="font-semibold truncate">
																			{courseDescriptions ?? subject}
																		</span>
																	</div>
																	<span className="text-[0.6rem] text-muted-foreground truncate text-left">
																		{secondLineParts.join(' · ')}
																	</span>
																</div>
															</button>
														</TooltipTrigger>
														<TooltipContent>
															<AgendaTooltipContent item={item} />
														</TooltipContent>
													</Tooltip>
												);
											})}
										</div>
									);
								})}
							</div>
						</div>
					</ScrollArea>
				)}
			</div>

			{selectedItem && (
				<AgendaItemModal
					item={selectedItem}
					isOpen={selectedItem !== null}
					onClose={() => setSelectedItem(null)}
				/>
			)}
		</>
	);
}
