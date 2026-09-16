'use client';

import { type RefObject, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DateAndTimeRangePicker } from '@/components/ui/date-and-time-range-picker';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAutoFocus } from '@/hooks/useAutofocus';
import { type AgendaSlotSelection, buildAgendaSlotSelection, selectionToFormValues } from '@/lib/agendaSlotSelection';
import { formatReturnMeasureSummary } from '@/lib/returnMeasureSummary';

interface NewAppointmentDialogProps {
	selection: AgendaSlotSelection;
	isOpen: boolean;
	onClose: () => void;
}

function ReturnMeasureForm({
	dateKey,
	startTime,
	endTime,
	description,
	dayCount,
	onDateKeyChange,
	onStartTimeChange,
	onEndTimeChange,
	onDescriptionChange,
	onDayCountChange,
	descriptionRef,
	popoverContainer,
	onDatePickerOpenChange,
}: {
	dateKey: string;
	startTime: string;
	endTime: string;
	description: string;
	dayCount: string;
	onDateKeyChange: (value: string) => void;
	onStartTimeChange: (value: string) => void;
	onEndTimeChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onDayCountChange: (value: string) => void;
	descriptionRef: RefObject<HTMLTextAreaElement | null>;
	popoverContainer?: HTMLElement | null;
	onDatePickerOpenChange?: (open: boolean) => void;
}) {
	const parsedDayCount = Number.parseInt(dayCount, 10);
	const summaryDayCount = Number.isFinite(parsedDayCount) && parsedDayCount >= 1 ? parsedDayCount : 1;
	const currentSelection = buildAgendaSlotSelection(dateKey, startTime, endTime);
	const summary = currentSelection
		? formatReturnMeasureSummary(currentSelection, summaryDayCount)
		: 'Controleer datum en tijden.';

	return (
		<div className="space-y-4">
			<DateAndTimeRangePicker
				dateKey={dateKey}
				startTime={startTime}
				endTime={endTime}
				onDateKeyChange={onDateKeyChange}
				onStartTimeChange={onStartTimeChange}
				onEndTimeChange={onEndTimeChange}
				dateId="return-measure-date"
				startTimeId="return-measure-start-time"
				endTimeId="return-measure-end-time"
				popoverContainer={popoverContainer}
				onDatePickerOpenChange={onDatePickerOpenChange}
			/>

			<Field>
				<Label htmlFor="return-measure-description">Omschrijving</Label>
				<Textarea
					ref={descriptionRef}
					id="return-measure-description"
					value={description}
					onChange={(event) => onDescriptionChange(event.target.value)}
					placeholder="Bijv. Spijbelen NE 16/09"
					rows={3}
					className="focus-visible:ring-0 focus-visible:ring-offset-0"
				/>
			</Field>

			<Field className="w-fit">
				<Label htmlFor="return-measure-day-count">Aantal dagen</Label>
				<Input
					id="return-measure-day-count"
					type="number"
					min={1}
					step={1}
					inputMode="numeric"
					value={dayCount}
					onChange={(event) => onDayCountChange(event.target.value)}
					className="w-16 px-2 text-center"
				/>
			</Field>

			<p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{summary}</p>
		</div>
	);
}

export default function NewAppointmentDialog({ selection, isOpen, onClose }: NewAppointmentDialogProps) {
	const descriptionRef = useAutoFocus<HTMLTextAreaElement>(isOpen);
	const [dialogContainer, setDialogContainer] = useState<HTMLDivElement | null>(null);
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const [description, setDescription] = useState('');
	const [dayCount, setDayCount] = useState('1');
	const [returnDateKey, setReturnDateKey] = useState('');
	const [returnStartTime, setReturnStartTime] = useState('');
	const [returnEndTime, setReturnEndTime] = useState('');

	useEffect(() => {
		if (!isOpen) return;
		const { dateKey, startTime, endTime } = selectionToFormValues(selection);
		setReturnDateKey(dateKey);
		setReturnStartTime(startTime);
		setReturnEndTime(endTime);
	}, [isOpen, selection]);

	const resetForm = () => {
		setDescription('');
		setDayCount('1');
		setReturnDateKey('');
		setReturnStartTime('');
		setReturnEndTime('');
		setDatePickerOpen(false);
	};

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			resetForm();
			onClose();
		}
	};

	const parsedDayCount = Number.parseInt(dayCount, 10);
	const returnMeasureSelection = buildAgendaSlotSelection(returnDateKey, returnStartTime, returnEndTime);
	const canSave =
		description.trim().length > 0 &&
		returnMeasureSelection !== null &&
		Number.isFinite(parsedDayCount) &&
		parsedDayCount >= 1;

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent
				ref={setDialogContainer}
				className="max-w-md"
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					descriptionRef.current?.focus();
				}}
				onPointerDownOutside={(event) => {
					if (datePickerOpen) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Terugkommaatregel aanmaken</DialogTitle>
				</DialogHeader>

				<div className="text-sm">
					<ReturnMeasureForm
						dateKey={returnDateKey}
						startTime={returnStartTime}
						endTime={returnEndTime}
						description={description}
						dayCount={dayCount}
						onDateKeyChange={setReturnDateKey}
						onStartTimeChange={setReturnStartTime}
						onEndTimeChange={setReturnEndTime}
						onDescriptionChange={setDescription}
						onDayCountChange={setDayCount}
						descriptionRef={descriptionRef}
						popoverContainer={dialogContainer}
						onDatePickerOpenChange={setDatePickerOpen}
					/>
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
						Annuleren
					</Button>
					<Button type="button" disabled={!canSave}>
						Opslaan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
