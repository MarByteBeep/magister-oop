'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentsContext } from '@/context/StudentsContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { findAgendaItem } from '@/lib/agendaUtils';
import { getDateKey, getNow, getStartOfWeek, getWeekDays } from '@/lib/dateUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import Agenda from './Agenda';
import AgendaItemModal from './AgendaItemModal';
import AgendaSyncButton from './AgendaSyncButton';

interface WeeklyAgendaViewProps {
	studentId: number;
}

const WEEKDAYS = ['ma', 'di', 'wo', 'do', 'vr'];

export default function WeeklyAgendaView({ studentId }: WeeklyAgendaViewProps) {
	const currentTime = useCurrentTime();
	const { students, loadAgendaForStudent } = useStudentsContext();
	const student = students.find((s) => s.id === studentId);

	const [isLoading, setIsLoading] = useState(false);
	const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);

	const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, 1 = next week
	const hasLoadedRef = useRef<Set<string>>(new Set()); // Track which weeks we've already fetched

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

	// Find current agenda item for today
	const activeAgendaItem = useMemo(() => {
		const todayItems = weekAgenda[todayKey] || [];
		return findAgendaItem(currentTime, todayItems);
	}, [weekAgenda, todayKey, currentTime]);

	const calendarItems = useMemo(() => {
		return weekDays.flatMap((day) => weekAgenda[getDateKey(day)] || []);
	}, [weekAgenda, weekDays]);

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
					<div className="flex-1 min-h-0 pt-2 pr-2 pb-2 pl-0">
						<Agenda
							items={calendarItems}
							date={getStartOfWeek(selectedWeekDate)}
							view="work_week"
							activeItemId={isCurrentWeek ? (activeAgendaItem?.id ?? null) : null}
							onSelectItem={(item) => setSelectedItem(item)}
						/>
					</div>
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
