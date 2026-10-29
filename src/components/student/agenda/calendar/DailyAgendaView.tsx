'use client';

import { memo } from 'react';
import Agenda from '@/components/student/agenda/calendar/Agenda';
import AgendaViewDialogs from '@/components/student/agenda/calendar/AgendaViewDialogs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgendaViewDialogs } from '@/hooks/agenda/useAgendaViewDialogs';
import { useDailyAgendaCalendarModel } from '@/hooks/agenda/useDailyAgendaCalendarModel';
import { useStudentById } from '@/hooks/students/useStudentById';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

export interface DailyAgendaViewProps {
	studentId: number;
	onOpenStudent?: (student: Student) => void;
}

function DailyAgendaSkeleton() {
	return (
		<div className="space-y-2 p-5">
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
		</div>
	);
}

interface DailyAgendaCalendarProps {
	studentId: number;
	onSelectEntry: (entry: AgendaEntry) => void;
	onSelectSlot: (selection: AgendaSlotSelection) => void;
	draftSelection: AgendaSlotSelection | null;
}

const DailyAgendaCalendar = memo(function DailyAgendaCalendar({
	studentId,
	onSelectEntry,
	onSelectSlot,
	draftSelection,
}: DailyAgendaCalendarProps) {
	const { currentTime, isLoading, stableEntries, stableActiveEntry } = useDailyAgendaCalendarModel(studentId);

	if (isLoading) return <DailyAgendaSkeleton />;

	return (
		<div className="h-full pt-2 pr-2 pb-2 pl-2">
			<Agenda
				entries={stableEntries}
				date={currentTime}
				view="day"
				activeEntry={stableActiveEntry}
				onSelectEntry={onSelectEntry}
				onSelectSlot={onSelectSlot}
				draftSelection={draftSelection}
			/>
		</div>
	);
});

function studentExterneIdOf(student: Student | undefined): string {
	if (student === undefined) return '';
	return student.externeId;
}

export default function DailyAgendaView({ studentId, onOpenStudent }: DailyAgendaViewProps) {
	const student = useStudentById(studentId);
	const { selectedEntry, draftSelection, onSelectEntry, onSelectSlot, clearSelectedEntry, clearDraftSelection } =
		useAgendaViewDialogs();

	return (
		<>
			<DailyAgendaCalendar
				studentId={studentId}
				onSelectEntry={onSelectEntry}
				onSelectSlot={onSelectSlot}
				draftSelection={draftSelection}
			/>
			<AgendaViewDialogs
				studentId={studentId}
				studentExterneId={studentExterneIdOf(student)}
				onOpenStudent={onOpenStudent}
				selectedEntry={selectedEntry}
				draftSelection={draftSelection}
				onCloseEntry={clearSelectedEntry}
				onCloseDraft={clearDraftSelection}
			/>
		</>
	);
}
