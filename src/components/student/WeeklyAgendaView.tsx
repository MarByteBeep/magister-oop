'use client';

import { useMemo, useState } from 'react';
import { useStudentsContext } from '@/context/StudentsContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useWeeklyAgenda } from '@/hooks/useWeeklyAgenda';
import { findActiveEntryPreferringLessons } from '@/lib/agendaEntryUtils';
import { getStartOfWeek } from '@/lib/dateUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
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
	const [selectedEntry, setSelectedEntry] = useState<AgendaEntry | null>(null);

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

	const activeEntry = useMemo(() => {
		const todayItems = weekAgenda[todayKey] || [];
		return findActiveEntryPreferringLessons(currentTime, todayItems);
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
							entries={calendarItems}
							date={getStartOfWeek(selectedWeekDate)}
							view="work_week"
							activeEntry={isCurrentWeek ? activeEntry : null}
							onSelectEntry={(entry) => setSelectedEntry(entry)}
						/>
					</div>
				)}
			</div>

			{selectedEntry && (
				<AgendaItemModal
					entry={selectedEntry}
					isOpen={selectedEntry !== null}
					onClose={() => setSelectedEntry(null)}
					onOpenStudent={onOpenStudent}
				/>
			)}
		</>
	);
}
