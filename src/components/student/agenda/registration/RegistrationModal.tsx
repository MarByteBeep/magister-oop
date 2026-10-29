'use client';

import RegistrationDeleteConfirmDialog from '@/components/student/agenda/registration/RegistrationDeleteConfirmDialog';
import RegistrationModalBody from '@/components/student/agenda/registration/RegistrationModalBody';
import { Dialog } from '@/components/ui/dialog';
import { useStudentsContext } from '@/context/StudentsContext';
import { useRegistrationModalActions } from '@/hooks/agenda/useRegistrationModalActions';
import { resolveRegistrationModalDisplay } from '@/lib/registrations/registrationModalDisplay';
import type { RegistrationAgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

function findRegistrationModalStudent(students: Student[], studentId: number | undefined): Student | undefined {
	if (studentId === undefined) return undefined;
	return students.find((item) => item.id === studentId);
}

function canPrintRegistrationTardySlip(isLate: boolean, student: Student | undefined): boolean {
	if (!isLate) return false;
	return student !== undefined;
}

function isBlankHour(hour: string | number | null | undefined): boolean {
	if (hour === null) return true;
	if (hour === undefined) return true;
	return hour === '';
}

function registrationLessonInfoLabel(hour: string | number | null | undefined): string {
	if (isBlankHour(hour)) return 'deze les';
	return `lesuur ${hour}`;
}

function registrationSubjectLabel(subjectName: string | undefined): string {
	if (subjectName) return subjectName;
	return 'deze les';
}

export interface RegistrationModalProps {
	entry: RegistrationAgendaEntry;
	studentId?: number;
	isOpen: boolean;
	onClose: () => void;
	onOpenStudent?: (student: Student) => void;
}

function handleDialogOpenChange(open: boolean, isDeleting: boolean, onClose: () => void) {
	if (open) return;
	if (isDeleting) return;
	onClose();
}

export default function RegistrationModal({
	entry,
	studentId,
	isOpen,
	onClose,
	onOpenStudent,
}: RegistrationModalProps) {
	const { students } = useStudentsContext();
	const student = findRegistrationModalStudent(students, studentId);
	const display = resolveRegistrationModalDisplay(entry, student);
	const canPrintTardySlip = canPrintRegistrationTardySlip(entry.registration.tone === 'late', student);
	const actions = useRegistrationModalActions(
		entry,
		student,
		registrationLessonInfoLabel(display.hour),
		registrationSubjectLabel(display.subjectName),
		onClose,
	);

	return (
		<>
			<Dialog open={isOpen} onOpenChange={(open) => handleDialogOpenChange(open, actions.isDeleting, onClose)}>
				<RegistrationModalBody
					entry={entry}
					student={student}
					display={display}
					canPrintTardySlip={canPrintTardySlip}
					isDeleting={actions.isDeleting}
					onOpenStudent={onOpenStudent}
					onPrintTardySlip={actions.handlePrintTardySlip}
					onRequestDelete={() => actions.setConfirmDelete(true)}
				/>
			</Dialog>

			<RegistrationDeleteConfirmDialog
				description={entry.registration.description}
				isDeleting={actions.isDeleting}
				isOpen={actions.confirmDelete}
				onCancel={() => actions.setConfirmDelete(false)}
				onConfirm={actions.handleConfirmDelete}
			/>
		</>
	);
}
