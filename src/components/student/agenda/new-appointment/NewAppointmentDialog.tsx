'use client';

import { useState } from 'react';
import NewAppointmentDialogContent from '@/components/student/agenda/new-appointment/NewAppointmentDialogContent';
import { Dialog } from '@/components/ui/dialog';
import { useNewAppointmentDialogState } from '@/hooks/agenda/useNewAppointmentDialogState';
import { useAutoFocus } from '@/hooks/shared/useAutofocus';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';

function autoFocusAbsence(isOpen: boolean, showAbsence: boolean): boolean {
	if (!isOpen) return false;
	return showAbsence;
}

function autoFocusDescription(isOpen: boolean, showAbsence: boolean): boolean {
	if (!isOpen) return false;
	return !showAbsence;
}

export interface NewAppointmentDialogProps {
	studentId: number;
	studentExterneId: string;
	selection: AgendaSlotSelection;
	isOpen: boolean;
	onClose: () => void;
}

export default function NewAppointmentDialog({
	studentId,
	studentExterneId,
	selection,
	isOpen,
	onClose,
}: NewAppointmentDialogProps) {
	const [dialogContainer, setDialogContainer] = useState<HTMLDivElement | null>(null);
	const state = useNewAppointmentDialogState(studentId, studentExterneId, selection, isOpen, onClose);
	const showAbsence = state.mode === 'absence';
	const reasonRef = useAutoFocus<HTMLInputElement>(autoFocusAbsence(isOpen, showAbsence));
	const descriptionRef = useAutoFocus<HTMLTextAreaElement>(autoFocusDescription(isOpen, showAbsence));

	return (
		<Dialog open={isOpen} onOpenChange={state.handleOpenChange}>
			<NewAppointmentDialogContent
				state={state}
				showAbsence={showAbsence}
				dialogContainer={dialogContainer}
				setDialogContainer={setDialogContainer}
				reasonRef={reasonRef}
				descriptionRef={descriptionRef}
			/>
		</Dialog>
	);
}
