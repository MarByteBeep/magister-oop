'use client';

import { useMemo, useState } from 'react';
import { useStudentsContext } from '@/context/StudentsContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useWeeklyAgenda } from '@/hooks/useWeeklyAgenda';
import { findAgendaItem } from '@/lib/agendaUtils';
import { getStartOfWeek } from '@/lib/dateUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';
import Agenda from './Agenda';
import AgendaItemModal from './AgendaItemModal';
import WeeklyAgendaNavigation from './WeeklyAgendaNavigation';
import WeeklyAgendaSkeleton from './WeeklyAgendaSkeleton';

interface WeeklyAgendaViewProps {
	studentId: number;
	onOpenStudent?: (student: Student) => void;
}

export default function WeeklyAgendaView({ studentId, onOpenStudent }: WeeklyAgendaViewProps) {
	const currentTime = useCurrentTime();
	const { students, loadAgendaForStudent } = useStudentsContext();
	const student = students.find((s) => s.id === studentId);
	const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);

	const {
		isLoading,
		selectedWeekDate,
		syncRange,
		weekAgenda,
		todayKey,
		isCurrentWeek,
		calendarItems,
		weekRangeText,
		hasAnyItems,
		goToPreviousWeek,
		goToNextWeek,
		goToCurrentWeek,
	} = useWeeklyAgenda(studentId, student, loadAgendaForStudent);

	const activeAgendaItem = useMemo(() => {
		const todayItems = weekAgenda[todayKey] || [];
		return findAgendaItem(currentTime, todayItems);
	}, [weekAgenda, todayKey, currentTime]);

	if (isLoading) return <WeeklyAgendaSkeleton />;

	return (
		<>
			<div className="flex flex-col h-[520px]">
				<WeeklyAgendaNavigation
					weekRangeText={weekRangeText}
					isCurrentWeek={isCurrentWeek}
					studentId={studentId}
					syncRangeStart={syncRange.start}
					syncRangeEnd={syncRange.end}
					onPreviousWeek={goToPreviousWeek}
					onNextWeek={goToNextWeek}
					onCurrentWeek={goToCurrentWeek}
				/>

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
					onOpenStudent={onOpenStudent}
				/>
			)}
		</>
	);
}
