'use client';

import type { RefObject } from 'react';
import NewAppointmentAbsenceForm from '@/components/student/agenda/new-appointment/NewAppointmentAbsenceForm';
import NewAppointmentReturnMeasureForm from '@/components/student/agenda/new-appointment/NewAppointmentReturnMeasureForm';
import type { AppointmentState } from '@/hooks/agenda/useNewAppointmentDialogState';

export interface NewAppointmentDialogFormsProps {
	state: AppointmentState;
	showAbsence: boolean;
	dialogContainer: HTMLDivElement | null;
	reasonRef: RefObject<HTMLInputElement | null>;
	descriptionRef: RefObject<HTMLTextAreaElement | null>;
}

function formLayerClassName(visible: boolean): string {
	if (visible) return 'col-start-1 row-start-1';
	return 'col-start-1 row-start-1 invisible pointer-events-none';
}

function inertWhenHidden(visible: boolean): true | undefined {
	if (visible) return undefined;
	return true;
}

function AbsenceFormLayer({
	state,
	visible,
	dialogContainer,
	reasonRef,
}: {
	state: AppointmentState;
	visible: boolean;
	dialogContainer: HTMLDivElement | null;
	reasonRef: RefObject<HTMLInputElement | null>;
}) {
	return (
		<div className={formLayerClassName(visible)} aria-hidden={!visible} inert={inertWhenHidden(visible)}>
			<NewAppointmentAbsenceForm
				dateKey={state.dateKey}
				startTime={state.startTime}
				endTime={state.endTime}
				attendanceTypes={state.attendanceTypes}
				attendanceTypeCode={state.attendanceTypeCode}
				comment={state.comment}
				internalComment={state.internalComment}
				onDateKeyChange={state.setDateKey}
				onStartTimeChange={state.setStartTime}
				onEndTimeChange={state.setEndTime}
				onAttendanceTypeCodeChange={state.setAttendanceTypeCode}
				onCommentChange={state.setComment}
				onInternalCommentChange={state.setInternalComment}
				reasonRef={reasonRef}
				popoverContainer={dialogContainer}
				onDatePickerOpenChange={state.setDatePickerOpen}
				onReasonComboboxOpenChange={state.setReasonComboboxOpen}
			/>
		</div>
	);
}

function ReturnMeasureFormLayer({
	state,
	visible,
	dialogContainer,
	descriptionRef,
}: {
	state: AppointmentState;
	visible: boolean;
	dialogContainer: HTMLDivElement | null;
	descriptionRef: RefObject<HTMLTextAreaElement | null>;
}) {
	return (
		<div className={formLayerClassName(visible)} aria-hidden={!visible} inert={inertWhenHidden(visible)}>
			<NewAppointmentReturnMeasureForm
				dateKey={state.dateKey}
				startTime={state.startTime}
				endTime={state.endTime}
				description={state.description}
				dayCount={state.dayCount}
				onDateKeyChange={state.setDateKey}
				onStartTimeChange={state.setStartTime}
				onEndTimeChange={state.setEndTime}
				onDescriptionChange={state.setDescription}
				onDayCountChange={state.setDayCount}
				descriptionRef={descriptionRef}
				popoverContainer={dialogContainer}
				onDatePickerOpenChange={state.setDatePickerOpen}
			/>
		</div>
	);
}

export default function NewAppointmentDialogForms({
	state,
	showAbsence,
	dialogContainer,
	reasonRef,
	descriptionRef,
}: NewAppointmentDialogFormsProps) {
	return (
		<div className="grid text-sm">
			<AbsenceFormLayer
				state={state}
				visible={showAbsence}
				dialogContainer={dialogContainer}
				reasonRef={reasonRef}
			/>
			<ReturnMeasureFormLayer
				state={state}
				visible={!showAbsence}
				dialogContainer={dialogContainer}
				descriptionRef={descriptionRef}
			/>
		</div>
	);
}
