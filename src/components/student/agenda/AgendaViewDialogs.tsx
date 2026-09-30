'use client';

import AgendaItemModal from '@/components/student/agenda/AgendaItemModal';
import NewAppointmentDialog from '@/components/student/agenda/NewAppointmentDialog';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

interface AgendaViewDialogsProps {
	studentId: number;
	onOpenStudent?: (student: Student) => void;
	selectedEntry: AgendaEntry | null;
	draftSelection: AgendaSlotSelection | null;
	onCloseEntry: () => void;
	onCloseDraft: () => void;
}

export default function AgendaViewDialogs({
	studentId,
	onOpenStudent,
	selectedEntry,
	draftSelection,
	onCloseEntry,
	onCloseDraft,
}: AgendaViewDialogsProps) {
	return (
		<>
			{selectedEntry && (
				<AgendaItemModal
					entry={selectedEntry}
					isOpen={selectedEntry !== null}
					onClose={onCloseEntry}
					onOpenStudent={onOpenStudent}
				/>
			)}

			{draftSelection && (
				<NewAppointmentDialog
					studentId={studentId}
					selection={draftSelection}
					isOpen={draftSelection !== null}
					onClose={onCloseDraft}
				/>
			)}
		</>
	);
}
