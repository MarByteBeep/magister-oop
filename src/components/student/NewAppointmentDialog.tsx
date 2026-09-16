'use client';

import { useEffect, useState } from 'react';
import { LuCalendar, LuClock } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { DateAndTimeRangePicker } from '@/components/ui/date-and-time-range-picker';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { AgendaCreationKind } from '@/lib/agendaCreationKind';
import { isAgendaCreationKind } from '@/lib/agendaCreationKind';
import { type AgendaSlotSelection, buildAgendaSlotSelection, selectionToFormValues } from '@/lib/agendaSlotSelection';
import { formatTime } from '@/lib/dateUtils';
import { formatReturnMeasureSummary } from '@/lib/returnMeasureSummary';

interface NewAppointmentDialogProps {
	selection: AgendaSlotSelection;
	isOpen: boolean;
	onClose: () => void;
}

const toggleItemClassName = 'flex-1 transition-none';

function formatSelectionDate(date: Date): string {
	return date.toLocaleDateString('nl-NL', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

function DateTimeSummary({ selection }: { selection: AgendaSlotSelection }) {
	return (
		<>
			<div className="flex items-center gap-2 text-muted-foreground">
				<LuCalendar className="size-4 shrink-0" />
				<span>{formatSelectionDate(selection.start)}</span>
			</div>
			<div className="flex items-center gap-2 text-muted-foreground">
				<LuClock className="size-4 shrink-0" />
				<span>
					{formatTime(selection.start)} – {formatTime(selection.end)}
				</span>
			</div>
		</>
	);
}

function AppointmentForm({
	description,
	onDescriptionChange,
}: {
	description: string;
	onDescriptionChange: (value: string) => void;
}) {
	return (
		<Field>
			<Label htmlFor="appointment-description">Omschrijving</Label>
			<Textarea
				id="appointment-description"
				value={description}
				onChange={(event) => onDescriptionChange(event.target.value)}
				placeholder="Bijv. gesprek met mentor"
				rows={3}
			/>
		</Field>
	);
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
					id="return-measure-description"
					value={description}
					onChange={(event) => onDescriptionChange(event.target.value)}
					placeholder="Bijv. Spijbelen NE 16/09"
					rows={3}
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
	const [dialogContainer, setDialogContainer] = useState<HTMLDivElement | null>(null);
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const [kind, setKind] = useState<AgendaCreationKind>('appointment');
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
		setKind('appointment');
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

	const handleKindChange = (value: string) => {
		if (!isAgendaCreationKind(value)) return;
		setKind(value);
	};

	const isReturnMeasure = kind === 'return-measure';
	const parsedDayCount = Number.parseInt(dayCount, 10);
	const returnMeasureSelection = buildAgendaSlotSelection(returnDateKey, returnStartTime, returnEndTime);
	const canSave =
		description.trim().length > 0 &&
		(!isReturnMeasure ||
			(returnMeasureSelection !== null && Number.isFinite(parsedDayCount) && parsedDayCount >= 1));

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent
				ref={setDialogContainer}
				className="max-w-md"
				onPointerDownOutside={(event) => {
					if (datePickerOpen) event.preventDefault();
				}}
			>
				<ToggleGroup
					type="single"
					value={kind}
					onValueChange={handleKindChange}
					className="grid w-full grid-cols-2"
				>
					<ToggleGroupItem value="appointment" aria-label="Nieuwe afspraak" className={toggleItemClassName}>
						Afspraak
					</ToggleGroupItem>
					<ToggleGroupItem
						value="return-measure"
						aria-label="Nieuwe terugkommaatregel"
						className={toggleItemClassName}
					>
						Terugkommaatregel
					</ToggleGroupItem>
				</ToggleGroup>

				<DialogHeader className="sr-only">
					<DialogTitle>{isReturnMeasure ? 'Terugkommaatregel' : 'Afspraak'}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 text-sm">
					{!isReturnMeasure && <DateTimeSummary selection={selection} />}

					{isReturnMeasure ? (
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
							popoverContainer={dialogContainer}
							onDatePickerOpenChange={setDatePickerOpen}
						/>
					) : (
						<AppointmentForm description={description} onDescriptionChange={setDescription} />
					)}
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
