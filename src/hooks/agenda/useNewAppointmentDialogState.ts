import { type Dispatch, useEffect, useReducer, useState } from 'react';
import { toast } from 'sonner';
import { canSaveNewAppointment, saveNewAppointment } from '@/hooks/agenda/newAppointmentDialogSave';
import { ensureAttendanceTypes, getAttendanceTypes } from '@/lib/absence-notice/attendanceTypes';
import { type AgendaSlotSelection, selectionToFormValues } from '@/lib/agenda/slotSelection';
import type { AttendanceType } from '@/magister/response/attendanceType.types';

export type CreateMode = 'absence' | 'return-measure';

type AppointmentFormFields = {
	mode: CreateMode;
	description: string;
	dayCount: string;
	dateKey: string;
	startTime: string;
	endTime: string;
	attendanceTypeCode: string;
	comment: string;
	internalComment: string;
};

type DialogUiState = {
	datePickerOpen: boolean;
	reasonComboboxOpen: boolean;
	isSaving: boolean;
};

type FormState = AppointmentFormFields & DialogUiState;

type FormAction = { type: 'reset' } | { type: 'set'; field: keyof FormState; value: FormState[keyof FormState] };

function emptyAppointmentFormFields(): AppointmentFormFields {
	return {
		mode: 'absence',
		description: '',
		dayCount: '1',
		dateKey: '',
		startTime: '',
		endTime: '',
		attendanceTypeCode: '',
		comment: '',
		internalComment: '',
	};
}

function initialFormState(): FormState {
	return {
		...emptyAppointmentFormFields(),
		datePickerOpen: false,
		reasonComboboxOpen: false,
		isSaving: false,
	};
}

function formReducer(state: FormState, action: FormAction): FormState {
	if (action.type === 'reset') return initialFormState();
	return { ...state, [action.field]: action.value };
}

function useAppointmentDialogFormState() {
	const [state, dispatch] = useReducer(formReducer, undefined, initialFormState);

	function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
		dispatch({ type: 'set', field, value });
	}

	return {
		dispatch,
		datePickerOpen: state.datePickerOpen,
		setDatePickerOpen: (value: boolean) => setField('datePickerOpen', value),
		reasonComboboxOpen: state.reasonComboboxOpen,
		setReasonComboboxOpen: (value: boolean) => setField('reasonComboboxOpen', value),
		isSaving: state.isSaving,
		setIsSaving: (value: boolean) => setField('isSaving', value),
		mode: state.mode,
		setMode: (value: CreateMode) => setField('mode', value),
		description: state.description,
		setDescription: (value: string) => setField('description', value),
		dayCount: state.dayCount,
		setDayCount: (value: string) => setField('dayCount', value),
		dateKey: state.dateKey,
		setDateKey: (value: string) => setField('dateKey', value),
		startTime: state.startTime,
		setStartTime: (value: string) => setField('startTime', value),
		endTime: state.endTime,
		setEndTime: (value: string) => setField('endTime', value),
		attendanceTypeCode: state.attendanceTypeCode,
		setAttendanceTypeCode: (value: string) => setField('attendanceTypeCode', value),
		comment: state.comment,
		setComment: (value: string) => setField('comment', value),
		internalComment: state.internalComment,
		setInternalComment: (value: string) => setField('internalComment', value),
		resetForm: () => dispatch({ type: 'reset' }),
	};
}

function unknownErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return 'Onbekende fout';
}

function applySelectionToForm(selection: AgendaSlotSelection, dispatch: Dispatch<FormAction>) {
	const values = selectionToFormValues(selection);
	dispatch({ type: 'set', field: 'dateKey', value: values.dateKey });
	dispatch({ type: 'set', field: 'startTime', value: values.startTime });
	dispatch({ type: 'set', field: 'endTime', value: values.endTime });
	dispatch({ type: 'set', field: 'mode', value: 'absence' });
}

function useSelectionFormSync(isOpen: boolean, selection: AgendaSlotSelection, dispatch: Dispatch<FormAction>) {
	useEffect(() => {
		if (!isOpen) return;
		applySelectionToForm(selection, dispatch);
	}, [isOpen, selection, dispatch]);
}

function loadAttendanceTypesOrToast(studentExterneId: string, setAttendanceTypes: (types: AttendanceType[]) => void) {
	void ensureAttendanceTypes(studentExterneId)
		.then(setAttendanceTypes)
		.catch((error) => {
			console.error('Failed to load attendance types', error);
			toast.error('Fout bij het laden van afwezigheidsredenen', {
				description: unknownErrorMessage(error),
			});
		});
}

function applyCachedOrLoadAttendanceTypes(
	studentExterneId: string,
	setAttendanceTypes: (types: AttendanceType[]) => void,
) {
	const cached = getAttendanceTypes();
	if (cached.length > 0) {
		setAttendanceTypes(cached);
		return;
	}
	loadAttendanceTypesOrToast(studentExterneId, setAttendanceTypes);
}

function useAttendanceTypesLoader(
	isOpen: boolean,
	studentExterneId: string,
	setAttendanceTypes: (types: AttendanceType[]) => void,
) {
	useEffect(() => {
		if (!isOpen) return;
		if (!studentExterneId) return;
		applyCachedOrLoadAttendanceTypes(studentExterneId, setAttendanceTypes);
	}, [isOpen, studentExterneId, setAttendanceTypes]);
}

function shouldSaveAppointment(canSave: boolean, isSaving: boolean): boolean {
	return canSave && !isSaving;
}

async function saveAppointmentIfAllowed(
	canSave: boolean,
	isSaving: boolean,
	setIsSaving: (value: boolean) => void,
	formSnapshot: {
		mode: CreateMode;
		studentExterneId: string;
		dateKey: string;
		startTime: string;
		endTime: string;
		description: string;
		dayCount: string;
		attendanceTypeCode: string;
		comment: string;
		internalComment: string;
	},
	studentId: number,
	onSaved: () => void,
) {
	if (!shouldSaveAppointment(canSave, isSaving)) return;
	setIsSaving(true);
	const ok = await saveNewAppointment({ ...formSnapshot, studentId });
	setIsSaving(false);
	if (ok) onSaved();
}

export function useNewAppointmentDialogState(
	studentId: number,
	studentExterneId: string,
	selection: AgendaSlotSelection,
	isOpen: boolean,
	onClose: () => void,
) {
	const form = useAppointmentDialogFormState();
	const [attendanceTypes, setAttendanceTypes] = useState<AttendanceType[]>(() => getAttendanceTypes());

	useSelectionFormSync(isOpen, selection, form.dispatch);
	useAttendanceTypesLoader(isOpen, studentExterneId, setAttendanceTypes);

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			form.resetForm();
			onClose();
		}
	};

	const formSnapshot = {
		mode: form.mode,
		studentExterneId,
		dateKey: form.dateKey,
		startTime: form.startTime,
		endTime: form.endTime,
		description: form.description,
		dayCount: form.dayCount,
		attendanceTypeCode: form.attendanceTypeCode,
		comment: form.comment,
		internalComment: form.internalComment,
	};

	const canSave = canSaveNewAppointment(formSnapshot);

	const handleSave = async () => {
		await saveAppointmentIfAllowed(canSave, form.isSaving, form.setIsSaving, formSnapshot, studentId, () =>
			handleOpenChange(false),
		);
	};

	return {
		datePickerOpen: form.datePickerOpen,
		setDatePickerOpen: form.setDatePickerOpen,
		reasonComboboxOpen: form.reasonComboboxOpen,
		setReasonComboboxOpen: form.setReasonComboboxOpen,
		isSaving: form.isSaving,
		mode: form.mode,
		setMode: form.setMode,
		description: form.description,
		setDescription: form.setDescription,
		dayCount: form.dayCount,
		setDayCount: form.setDayCount,
		dateKey: form.dateKey,
		setDateKey: form.setDateKey,
		startTime: form.startTime,
		setStartTime: form.setStartTime,
		endTime: form.endTime,
		setEndTime: form.setEndTime,
		attendanceTypes,
		attendanceTypeCode: form.attendanceTypeCode,
		setAttendanceTypeCode: form.setAttendanceTypeCode,
		comment: form.comment,
		setComment: form.setComment,
		internalComment: form.internalComment,
		setInternalComment: form.setInternalComment,
		canSave,
		handleOpenChange,
		handleSave,
	};
}

export type AppointmentState = ReturnType<typeof useNewAppointmentDialogState>;
