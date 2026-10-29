'use client';

import type { RefObject } from 'react';
import NewAppointmentDialogForms from '@/components/student/agenda/new-appointment/NewAppointmentDialogForms';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { AppointmentState } from '@/hooks/agenda/useNewAppointmentDialogState';

function isComboboxContentTarget(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) return false;
	return target.closest('[data-slot="combobox-content"]') !== null;
}

function focusElement(element: { focus: () => void } | null) {
	if (!element) return;
	element.focus();
}

function preventWhenDatePickerOpen(datePickerOpen: boolean, event: { preventDefault: () => void }) {
	if (!datePickerOpen) return;
	event.preventDefault();
}

function preventWhenComboboxTarget(event: { target: EventTarget | null; preventDefault: () => void }) {
	if (!isComboboxContentTarget(event.target)) return;
	event.preventDefault();
}

function preventEscapeWhenOverlayOpen(
	datePickerOpen: boolean,
	reasonComboboxOpen: boolean,
	event: { preventDefault: () => void },
) {
	if (datePickerOpen) {
		event.preventDefault();
		return;
	}
	if (!reasonComboboxOpen) return;
	event.preventDefault();
}

function focusAppointmentField(
	showAbsence: boolean,
	reasonRef: { current: HTMLInputElement | null },
	descriptionRef: { current: HTMLTextAreaElement | null },
) {
	if (showAbsence) {
		focusElement(reasonRef.current);
		return;
	}
	focusElement(descriptionRef.current);
}

function applyAppointmentMode(value: string, setMode: (mode: 'absence' | 'return-measure') => void) {
	if (value === 'absence') {
		setMode(value);
		return;
	}
	if (value !== 'return-measure') return;
	setMode(value);
}

function appointmentSaveDisabled(canSave: boolean, isSaving: boolean): boolean {
	if (!canSave) return true;
	return isSaving;
}

const modeToggleItemClass =
	'flex-1 transition-none data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm';

function NewAppointmentModeToggle({
	mode,
	setMode,
}: {
	mode: 'absence' | 'return-measure';
	setMode: (mode: 'absence' | 'return-measure') => void;
}) {
	return (
		<ToggleGroup
			type="single"
			value={mode}
			onValueChange={(value) => applyAppointmentMode(value, setMode)}
			className="w-full"
		>
			<ToggleGroupItem value="absence" className={modeToggleItemClass}>
				Afwezigheid
			</ToggleGroupItem>
			<ToggleGroupItem value="return-measure" className={modeToggleItemClass}>
				Terugkommaatregel
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

function NewAppointmentDialogFooter({
	canSave,
	isSaving,
	onCancel,
	onSave,
}: {
	canSave: boolean;
	isSaving: boolean;
	onCancel: () => void;
	onSave: () => void;
}) {
	return (
		<DialogFooter>
			<Button type="button" variant="outline" onClick={onCancel}>
				Annuleren
			</Button>
			<Button type="button" disabled={appointmentSaveDisabled(canSave, isSaving)} onClick={onSave}>
				Opslaan
			</Button>
		</DialogFooter>
	);
}

export interface NewAppointmentDialogContentProps {
	state: AppointmentState;
	showAbsence: boolean;
	dialogContainer: HTMLDivElement | null;
	setDialogContainer: (node: HTMLDivElement | null) => void;
	reasonRef: RefObject<HTMLInputElement | null>;
	descriptionRef: RefObject<HTMLTextAreaElement | null>;
}

export default function NewAppointmentDialogContent({
	state,
	showAbsence,
	dialogContainer,
	setDialogContainer,
	reasonRef,
	descriptionRef,
}: NewAppointmentDialogContentProps) {
	return (
		<DialogContent
			ref={setDialogContainer}
			className="max-w-md"
			onOpenAutoFocus={(event) => {
				event.preventDefault();
				focusAppointmentField(showAbsence, reasonRef, descriptionRef);
			}}
			onPointerDownOutside={(event) => {
				preventWhenDatePickerOpen(state.datePickerOpen, event);
				preventWhenComboboxTarget(event);
			}}
			onFocusOutside={preventWhenComboboxTarget}
			onEscapeKeyDown={(event) =>
				preventEscapeWhenOverlayOpen(state.datePickerOpen, state.reasonComboboxOpen, event)
			}
		>
			<DialogHeader>
				<DialogTitle>Nieuwe melding</DialogTitle>
			</DialogHeader>

			<NewAppointmentModeToggle mode={state.mode} setMode={state.setMode} />

			{/* Both forms share one grid cell so height stays at the taller absence layout. */}
			<NewAppointmentDialogForms
				state={state}
				showAbsence={showAbsence}
				dialogContainer={dialogContainer}
				reasonRef={reasonRef}
				descriptionRef={descriptionRef}
			/>

			<NewAppointmentDialogFooter
				canSave={state.canSave}
				isSaving={state.isSaving}
				onCancel={() => state.handleOpenChange(false)}
				onSave={() => void state.handleSave()}
			/>
		</DialogContent>
	);
}
