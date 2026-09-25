'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useLoadAgendaForStudent } from '@/hooks/useLoadAgendaForStudent';
import { useStableAgendaEntries, useStableAgendaEntry } from '@/hooks/useStableAgendaEntries';
import { useStudentById } from '@/hooks/useStudentById';
import { useWeeklyAgenda } from '@/hooks/useWeeklyAgenda';
import { findActiveEntryPreferringLessons } from '@/lib/agendaEntryUtils';
import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { getStartOfWeek } from '@/lib/dateUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/types/student.types';
import Agenda from './Agenda';
import AgendaItemModal from './AgendaItemModal';
import NewAppointmentDialog from './NewAppointmentDialog';
import WeeklyAgendaNavigation from './WeeklyAgendaNavigation';
import WeeklyAgendaSkeleton from './WeeklyAgendaSkeleton';

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
	const [selectedEntry, setSelectedEntry] = useState<AgendaEntry | null>(null);
	const [draftSelection, setDraftSelection] = useState<AgendaSlotSelection | null>(null);
	const handleSelectEntry = useCallback((entry: AgendaEntry) => setSelectedEntry(entry), []);
	const handleSelectSlot = useCallback((selection: AgendaSlotSelection) => setDraftSelection(selection), []);

	return (
		<>
			<WeeklyAgendaCalendar
				studentId={studentId}
				focusDate={focusDate}
				onSelectEntry={handleSelectEntry}
				onSelectSlot={handleSelectSlot}
				draftSelection={draftSelection}
			/>

			{selectedEntry && (
				<AgendaItemModal
					entry={selectedEntry}
					isOpen={selectedEntry !== null}
					onClose={() => setSelectedEntry(null)}
					onOpenStudent={onOpenStudent}
				/>
			)}

			{draftSelection && (
				<NewAppointmentDialog
					studentId={studentId}
					selection={draftSelection}
					isOpen={draftSelection !== null}
					onClose={() => setDraftSelection(null)}
				/>
			)}
		</>
	);
}
