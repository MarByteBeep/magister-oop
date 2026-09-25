'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useDailyAgendaBootstrap } from '@/hooks/useDailyAgendaBootstrap';
import { useLoadAgendaForStudent } from '@/hooks/useLoadAgendaForStudent';
import { useStableAgendaEntries, useStableAgendaEntry } from '@/hooks/useStableAgendaEntries';
import { useStudentById } from '@/hooks/useStudentById';
import { findActiveEntryPreferringLessons } from '@/lib/agendaEntryUtils';
import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { getDateKey, getWorkWeekRange } from '@/lib/dateUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/types/student.types';
import Agenda from './Agenda';
import AgendaItemModal from './AgendaItemModal';
import NewAppointmentDialog from './NewAppointmentDialog';

interface DailyAgendaViewProps {
	studentId: number;
	onOpenStudent?: (student: Student) => void;
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
	const currentTime = useCurrentTime();
	const loadAgendaForStudent = useLoadAgendaForStudent();
	const student = useStudentById(studentId);

	const todayKey = useMemo(() => getDateKey(currentTime), [currentTime]);
	const workWeekStartKey = useMemo(() => getDateKey(getWorkWeekRange(currentTime).start), [currentTime]);
	const agendaFromContext = student?.agenda?.[todayKey];

	const { bootstrapAgenda, isLoading } = useDailyAgendaBootstrap(
		student,
		todayKey,
		workWeekStartKey,
		loadAgendaForStudent,
	);

	const agendaEntries: AgendaEntry[] | undefined =
		agendaFromContext !== undefined ? agendaFromContext : bootstrapAgenda;

	const activeEntry = findActiveEntryPreferringLessons(currentTime, agendaEntries ?? []);
	const stableEntries = useStableAgendaEntries(agendaEntries ?? []);
	const stableActiveEntry = useStableAgendaEntry(activeEntry);

	if (isLoading) {
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

export default function DailyAgendaView({ studentId, onOpenStudent }: DailyAgendaViewProps) {
	const [selectedEntry, setSelectedEntry] = useState<AgendaEntry | null>(null);
	const [draftSelection, setDraftSelection] = useState<AgendaSlotSelection | null>(null);
	const handleSelectEntry = useCallback((entry: AgendaEntry) => setSelectedEntry(entry), []);
	const handleSelectSlot = useCallback((selection: AgendaSlotSelection) => setDraftSelection(selection), []);

	return (
		<>
			<DailyAgendaCalendar
				studentId={studentId}
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
