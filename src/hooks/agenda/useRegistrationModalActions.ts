import { useState } from 'react';
import { printTardySlip } from '@/lib/agenda/tardySlip';
import { deleteRegistration } from '@/lib/registrations/delete';
import { getDateKey } from '@/lib/shared/dateUtils';
import { formatPersonName } from '@/lib/shared/stringUtils';
import type { RegistrationAgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

export function useRegistrationModalActions(
	entry: RegistrationAgendaEntry,
	student: Student | undefined,
	lessonInfo: string,
	subject: string,
	onClose: () => void,
) {
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const { registration } = entry;

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
		if (!ok) return;
		setConfirmDelete(false);
		onClose();
	};

	return {
		confirmDelete,
		isDeleting,
		setConfirmDelete,
		handlePrintTardySlip,
		handleConfirmDelete,
	};
}
