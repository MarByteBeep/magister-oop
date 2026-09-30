'use client';

import { memo, useMemo } from 'react';
import Agenda from '@/components/student/agenda/Agenda';
import AgendaViewDialogs from '@/components/student/agenda/AgendaViewDialogs';
import WeeklyAgendaNavigation from '@/components/student/agenda/WeeklyAgendaNavigation';
import WeeklyAgendaSkeleton from '@/components/student/agenda/WeeklyAgendaSkeleton';
import { useAgendaViewDialogs } from '@/hooks/agenda/useAgendaViewDialogs';
import { useLoadAgendaForStudent } from '@/hooks/agenda/useLoadAgendaForStudent';
import { useStableAgendaEntries, useStableAgendaEntry } from '@/hooks/agenda/useStableAgendaEntries';
import { useWeeklyAgenda } from '@/hooks/agenda/useWeeklyAgenda';
import { useCurrentTime } from '@/hooks/shared/useCurrentTime';
import { useStudentById } from '@/hooks/students/useStudentById';
import { findActiveEntryPreferringLessons } from '@/lib/agenda/entryUtils';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { getStartOfWeek } from '@/lib/shared/dateUtils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

interface WeeklyAgendaViewProps {
	studentId: number;
	onOpenStudent?: (student: Student) => void;
	focusDate?: Date;
}

interface WeeklyAgendaCalendarProps {
	studentId: number;
	focusDate?: Date;
	onSelectEntry: (entry: AgendaEntry) => void;
	onSelectSlot: (selection: AgendaSlotSelection) => void;
	draftSelection: AgendaSlotSelection | null;
}

const WeeklyAgendaCalendar = memo(function WeeklyAgendaCalendar({
	studentId,
	focusDate,
	onSelectEntry,
	onSelectSlot,
	draftSelection,
}: WeeklyAgendaCalendarProps) {
	const currentTime = useCurrentTime();
	const loadAgendaForStudent = useLoadAgendaForStudent();
	const student = useStudentById(studentId);

	const {
		isLoading,
		selectedWeekDate,
		syncRange,
		todayKey,
		isCurrentWeek,
		calendarItems,
		weekRangeText,
		goToPreviousWeek,
		goToNextWeek,
		goToCurrentWeek,
	} = useWeeklyAgenda(studentId, student, loadAgendaForStudent, focusDate);

	const activeEntry = useMemo(() => {
		const todayItems = student?.agenda?.[todayKey] ?? [];
		return findActiveEntryPreferringLessons(currentTime, todayItems);
	}, [currentTime, student, todayKey]);
	const stableEntries = useStableAgendaEntries(calendarItems);
	const stableActiveEntry = useStableAgendaEntry(isCurrentWeek ? activeEntry : null);
	const calendarDate = useMemo(() => getStartOfWeek(selectedWeekDate), [selectedWeekDate]);

	if (isLoading) return <WeeklyAgendaSkeleton />;

	return (
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

			<div className="flex-1 min-h-0 pt-2 pr-2 pb-2 pl-0">
				<Agenda
					entries={stableEntries}
					date={calendarDate}
					view="work_week"
					activeEntry={stableActiveEntry}
					onSelectEntry={onSelectEntry}
					onSelectSlot={onSelectSlot}
					draftSelection={draftSelection}
				/>
			</div>
		</div>
	);
});

export default function WeeklyAgendaView({ studentId, onOpenStudent, focusDate }: WeeklyAgendaViewProps) {
	const { selectedEntry, draftSelection, onSelectEntry, onSelectSlot, clearSelectedEntry, clearDraftSelection } =
		useAgendaViewDialogs();

	return (
		<>
			<WeeklyAgendaCalendar
				studentId={studentId}
				focusDate={focusDate}
				onSelectEntry={onSelectEntry}
				onSelectSlot={onSelectSlot}
				draftSelection={draftSelection}
			/>
			<AgendaViewDialogs
				studentId={studentId}
				onOpenStudent={onOpenStudent}
				selectedEntry={selectedEntry}
				draftSelection={draftSelection}
				onCloseEntry={clearSelectedEntry}
				onCloseDraft={clearDraftSelection}
			/>
		</>
	);
}
