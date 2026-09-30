import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { canSaveNewAppointment, saveNewAppointment } from '@/hooks/agenda/newAppointmentDialogSave';
import { ensureAttendanceTypes, getAttendanceTypes } from '@/lib/absence-notice/attendanceTypes';
import { type AgendaSlotSelection, selectionToFormValues } from '@/lib/agenda/slotSelection';
import type { AttendanceType } from '@/magister/response/attendanceType.types';

export type CreateMode = 'absence' | 'return-measure';

export function useNewAppointmentDialogState(
	studentId: number,
	studentExterneId: string,
	selection: AgendaSlotSelection,
	isOpen: boolean,
	onClose: () => void,
) {
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const [reasonComboboxOpen, setReasonComboboxOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [mode, setMode] = useState<CreateMode>('absence');
	const [description, setDescription] = useState('');
	const [dayCount, setDayCount] = useState('1');
	const [dateKey, setDateKey] = useState('');
	const [startTime, setStartTime] = useState('');
	const [endTime, setEndTime] = useState('');
	const [attendanceTypes, setAttendanceTypes] = useState<AttendanceType[]>(() => getAttendanceTypes());
	const [attendanceTypeCode, setAttendanceTypeCode] = useState('');
	const [comment, setComment] = useState('');
	const [internalComment, setInternalComment] = useState('');

	useEffect(() => {
		if (!isOpen) return;
		const values = selectionToFormValues(selection);
		setDateKey(values.dateKey);
		setStartTime(values.startTime);
		setEndTime(values.endTime);
		setMode('absence');
	}, [isOpen, selection]);

	useEffect(() => {
		if (!isOpen || !studentExterneId) return;
		const cached = getAttendanceTypes();
		if (cached.length > 0) {
			setAttendanceTypes(cached);
			return;
		}
		void ensureAttendanceTypes(studentExterneId)
			.then(setAttendanceTypes)
			.catch((error) => {
				console.error('Failed to load attendance types', error);
				toast.error('Fout bij het laden van afwezigheidsredenen', {
					description: error instanceof Error ? error.message : 'Onbekende fout',
				});
			});
	}, [isOpen, studentExterneId]);

	const resetForm = () => {
		setMode('absence');
		setDescription('');
		setDayCount('1');
		setDateKey('');
		setStartTime('');
		setEndTime('');
		setAttendanceTypeCode('');
		setComment('');
		setInternalComment('');
		setDatePickerOpen(false);
		setReasonComboboxOpen(false);
	};

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			resetForm();
			onClose();
		}
	};

	const formSnapshot = {
		mode,
		studentExterneId,
		dateKey,
		startTime,
		endTime,
		description,
		dayCount,
		attendanceTypeCode,
		comment,
		internalComment,
	};

	const canSave = canSaveNewAppointment(formSnapshot);

	const handleSave = async () => {
		if (!canSave || isSaving) return;
		setIsSaving(true);
		const ok = await saveNewAppointment({ ...formSnapshot, studentId });
		setIsSaving(false);
		if (ok) handleOpenChange(false);
	};

	return {
		datePickerOpen,
		setDatePickerOpen,
		reasonComboboxOpen,
		setReasonComboboxOpen,
		isSaving,
		mode,
		setMode,
		description,
		setDescription,
		dayCount,
		setDayCount,
		dateKey,
		setDateKey,
		startTime,
		setStartTime,
		endTime,
		setEndTime,
		attendanceTypes,
		attendanceTypeCode,
		setAttendanceTypeCode,
		comment,
		setComment,
		internalComment,
		setInternalComment,
		canSave,
		handleOpenChange,
		handleSave,
	};
}
