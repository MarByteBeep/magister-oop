'use client';

import { useState } from 'react';
import NewAppointmentAbsenceForm from '@/components/student/agenda/NewAppointmentAbsenceForm';
import NewAppointmentReturnMeasureForm from '@/components/student/agenda/NewAppointmentReturnMeasureForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useNewAppointmentDialogState } from '@/hooks/agenda/useNewAppointmentDialogState';
import { useAutoFocus } from '@/hooks/shared/useAutofocus';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { cn } from '@/lib/utils';

const modeToggleItemClass =
	'flex-1 transition-none data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm';

interface NewAppointmentDialogProps {
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
	const reasonRef = useAutoFocus<HTMLInputElement>(isOpen && showAbsence);
	const descriptionRef = useAutoFocus<HTMLTextAreaElement>(isOpen && !showAbsence);

	return (
		<Dialog open={isOpen} onOpenChange={state.handleOpenChange}>
			<DialogContent
				ref={setDialogContainer}
				className="max-w-md"
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					if (showAbsence) reasonRef.current?.focus();
					else descriptionRef.current?.focus();
				}}
				onPointerDownOutside={(event) => {
					if (state.datePickerOpen) event.preventDefault();
					const target = event.target;
					if (target instanceof Element && target.closest('[data-slot="combobox-content"]')) {
						event.preventDefault();
					}
				}}
				onFocusOutside={(event) => {
					const target = event.target;
					if (target instanceof Element && target.closest('[data-slot="combobox-content"]')) {
						event.preventDefault();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle>Nieuwe melding</DialogTitle>
				</DialogHeader>

				<ToggleGroup
					type="single"
					value={state.mode}
					onValueChange={(value) => {
						if (value === 'absence' || value === 'return-measure') state.setMode(value);
					}}
					className="w-full"
				>
					<ToggleGroupItem value="absence" className={modeToggleItemClass}>
						Afwezigheid
					</ToggleGroupItem>
					<ToggleGroupItem value="return-measure" className={modeToggleItemClass}>
						Terugkommaatregel
					</ToggleGroupItem>
				</ToggleGroup>

				{/* Both forms share one grid cell so height stays at the taller absence layout. */}
				<div className="grid text-sm">
					<div
						className={cn('col-start-1 row-start-1', !showAbsence && 'invisible pointer-events-none')}
						aria-hidden={!showAbsence}
						inert={!showAbsence ? true : undefined}
					>
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
						/>
					</div>
					<div
						className={cn('col-start-1 row-start-1', showAbsence && 'invisible pointer-events-none')}
						aria-hidden={showAbsence}
						inert={showAbsence ? true : undefined}
					>
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
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => state.handleOpenChange(false)}>
						Annuleren
					</Button>
					<Button
						type="button"
						disabled={!state.canSave || state.isSaving}
						onClick={() => void state.handleSave()}
					>
						Opslaan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
