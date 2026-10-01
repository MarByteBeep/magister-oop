'use client';

import { useState } from 'react';
import { LuMessageSquare, LuPrinter } from 'react-icons/lu';
import RegistrationIcon from '@/components/registrations/RegistrationIcon';
import RegistrationDeleteConfirmDialog from '@/components/student/agenda/RegistrationDeleteConfirmDialog';
import RegistrationModalDetails from '@/components/student/agenda/RegistrationModalDetails';
import StudentItem from '@/components/student/StudentItem';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStudentsContext } from '@/context/StudentsContext';
import { printTardySlip } from '@/lib/agenda/tardySlip';
import { deleteRegistration } from '@/lib/registrations/delete';
import { resolveRegistrationModalDisplay } from '@/lib/registrations/registrationModalDisplay';
import { getDateKey } from '@/lib/shared/dateUtils';
import { formatPersonName } from '@/lib/shared/stringUtils';
import type { RegistrationAgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

interface RegistrationModalProps {
	entry: RegistrationAgendaEntry;
	studentId?: number;
	isOpen: boolean;
	onClose: () => void;
	onOpenStudent?: (student: Student) => void;
}

export default function RegistrationModal({
	entry,
	studentId,
	isOpen,
	onClose,
	onOpenStudent,
}: RegistrationModalProps) {
	const { students } = useStudentsContext();
	const student = studentId == null ? undefined : students.find((item) => item.id === studentId);
	const { registration } = entry;
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const display = resolveRegistrationModalDisplay(entry, student);
	const isLate = registration.tone === 'late';
	const canPrintTardySlip = isLate && student != null;
	const lessonInfo = display.hour ? `lesuur ${display.hour}` : 'deze les';
	const subject = display.subjectName || 'deze les';

	const handlePrintTardySlip = () => {
		if (!student) return;
		printTardySlip({
			studentName: formatPersonName(student.roepnaam, student.tussenvoegsel, student.achternaam),
			lessonInfo,
			subject,
		});
	};

	const handleConfirmDelete = async () => {
		if (isDeleting) return;
		setIsDeleting(true);
		const ok = await deleteRegistration(registration.id, getDateKey(new Date(entry.start)));
		setIsDeleting(false);
		if (ok) {
			setConfirmDelete(false);
			onClose();
		}
	};

	return (
		<>
			<Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
				<DialogContent className="max-w-[520px]">
					<DialogHeader>
						<DialogTitle className="flex items-start gap-2">
							<RegistrationIcon
								registration={registration}
								start={entry.start}
								end={entry.end}
								size="lg"
							/>
							<span className="min-w-0">{registration.description}</span>
						</DialogTitle>
					</DialogHeader>

					{student ? (
						<StudentItem
							student={student}
							classLabel={student.klassen.join(', ')}
							variant="card"
							onClick={onOpenStudent ? () => onOpenStudent(student) : undefined}
						/>
					) : null}

					<RegistrationModalDetails display={display} />

					{display.comment ? (
						<div className="flex items-start gap-1.5 text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
							<LuMessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
							<span className="text-foreground">{display.comment}</span>
						</div>
					) : null}

					<DialogFooter>
						{canPrintTardySlip ? (
							<Button
								type="button"
								variant="outline"
								onClick={handlePrintTardySlip}
								disabled={isDeleting}
							>
								<LuPrinter className="h-4 w-4" />
								Afdrukken
							</Button>
						) : null}
						<Button
							type="button"
							variant="destructive"
							onClick={() => setConfirmDelete(true)}
							disabled={isDeleting}
						>
							Verwijderen
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<RegistrationDeleteConfirmDialog
				description={registration.description}
				isDeleting={isDeleting}
				isOpen={confirmDelete}
				onCancel={() => setConfirmDelete(false)}
				onConfirm={handleConfirmDelete}
			/>
		</>
	);
}
