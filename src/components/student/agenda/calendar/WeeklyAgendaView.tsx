'use client';

import { memo } from 'react';
import Agenda from '@/components/student/agenda/calendar/Agenda';
import AgendaViewDialogs from '@/components/student/agenda/calendar/AgendaViewDialogs';
import WeeklyAgendaNavigation from '@/components/student/agenda/calendar/WeeklyAgendaNavigation';
import WeeklyAgendaSkeleton from '@/components/student/agenda/calendar/WeeklyAgendaSkeleton';
import { useAgendaViewDialogs } from '@/hooks/agenda/useAgendaViewDialogs';
import { useWeeklyAgendaCalendarModel } from '@/hooks/agenda/useWeeklyAgendaCalendarModel';
import { useStudentById } from '@/hooks/students/useStudentById';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

export interface WeeklyAgendaViewProps {
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

const WeeklyAgendaCalendar = memo(function WeeklyAgendaCalendar(props: WeeklyAgendaCalendarProps) {
	const model = useWeeklyAgendaCalendarModel(props.studentId, props.focusDate);

	if (model.isLoading) return <WeeklyAgendaSkeleton />;

	return (
		<div className="flex flex-col h-[520px]">
			<WeeklyAgendaNavigation
				weekRangeText={model.weekRangeText}
				isCurrentWeek={model.isCurrentWeek}
				studentId={props.studentId}
				syncRangeStart={model.syncRange.start}
				syncRangeEnd={model.syncRange.end}
				onPreviousWeek={model.goToPreviousWeek}
				onNextWeek={model.goToNextWeek}
				onCurrentWeek={model.goToCurrentWeek}
			/>

			<div className="flex-1 min-h-0 pt-2 pr-2 pb-2 pl-0">
				<Agenda
					entries={model.stableEntries}
					date={model.calendarDate}
					view="work_week"
					activeEntry={model.stableActiveEntry}
					onSelectEntry={props.onSelectEntry}
					onSelectSlot={props.onSelectSlot}
					draftSelection={props.draftSelection}
				/>
			</div>
		</div>
	);
});

function studentExterneId(student: Student | undefined): string {
	if (!student) return '';
	return student.externeId;
}

export default function WeeklyAgendaView(props: WeeklyAgendaViewProps) {
	const student = useStudentById(props.studentId);
	const dialogs = useAgendaViewDialogs();

	return (
		<>
			<WeeklyAgendaCalendar
				studentId={props.studentId}
				focusDate={props.focusDate}
				onSelectEntry={dialogs.onSelectEntry}
				onSelectSlot={dialogs.onSelectSlot}
				draftSelection={dialogs.draftSelection}
			/>
			<AgendaViewDialogs
				studentId={props.studentId}
				studentExterneId={studentExterneId(student)}
				onOpenStudent={props.onOpenStudent}
				selectedEntry={dialogs.selectedEntry}
				draftSelection={dialogs.draftSelection}
				onCloseEntry={dialogs.clearSelectedEntry}
				onCloseDraft={dialogs.clearDraftSelection}
			/>
		</>
	);
}
