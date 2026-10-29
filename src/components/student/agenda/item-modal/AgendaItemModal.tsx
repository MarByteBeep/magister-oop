'use client';

import ReturnMeasureModal from '@/components/return-measure/ReturnMeasureModal';
import StandardAgendaItemModal from '@/components/student/agenda/item-modal/StandardAgendaItemModal';
import RegistrationModal from '@/components/student/agenda/registration/RegistrationModal';
import { isRegistrationEntry, isReturnMeasureEntry } from '@/lib/agenda/entryUtils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

export interface AgendaItemModalProps {
	entry: AgendaEntry;
	studentId?: number;
	isOpen: boolean;
	onClose: () => void;
	onOpenStudent?: (student: Student) => void;
}

export default function AgendaItemModal({ entry, studentId, isOpen, onClose, onOpenStudent }: AgendaItemModalProps) {
	if (isReturnMeasureEntry(entry)) {
		return (
			<ReturnMeasureModal
				measure={entry.measure}
				isOpen={isOpen}
				onClose={onClose}
				onOpenStudent={onOpenStudent}
			/>
		);
	}

	if (isRegistrationEntry(entry)) {
		return (
			<RegistrationModal
				entry={entry}
				studentId={studentId}
				isOpen={isOpen}
				onClose={onClose}
				onOpenStudent={onOpenStudent}
			/>
		);
	}

	return <StandardAgendaItemModal entry={entry} isOpen={isOpen} onClose={onClose} onOpenStudent={onOpenStudent} />;
}
