'use client';

import type { RefObject } from 'react';
import { DateAndTimeRangePicker } from '@/components/ui/date-and-time-range-picker';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { buildAgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { formatReturnMeasureSummary } from '@/lib/return-measure/summary';

export interface NewAppointmentReturnMeasureFormProps {
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
}

function summaryDayCount(dayCount: string): number {
	const parsedDayCount = Number.parseInt(dayCount, 10);
	if (!Number.isFinite(parsedDayCount)) return 1;
	if (parsedDayCount < 1) return 1;
	return parsedDayCount;
}

function returnMeasureSummary(dateKey: string, startTime: string, endTime: string, dayCount: string): string {
	const currentSelection = buildAgendaSlotSelection(dateKey, startTime, endTime);
	if (!currentSelection) return 'Controleer datum en tijden.';
	return formatReturnMeasureSummary(currentSelection, summaryDayCount(dayCount));
}

export default function NewAppointmentReturnMeasureForm(props: NewAppointmentReturnMeasureFormProps) {
	const summary = returnMeasureSummary(props.dateKey, props.startTime, props.endTime, props.dayCount);

	return (
		<div className="space-y-4">
			<DateAndTimeRangePicker
				dateKey={props.dateKey}
				startTime={props.startTime}
				endTime={props.endTime}
				onDateKeyChange={props.onDateKeyChange}
				onStartTimeChange={props.onStartTimeChange}
				onEndTimeChange={props.onEndTimeChange}
				dateId="return-measure-date"
				startTimeId="return-measure-start-time"
				endTimeId="return-measure-end-time"
				popoverContainer={props.popoverContainer}
				onDatePickerOpenChange={props.onDatePickerOpenChange}
			/>

			<Field>
				<Label htmlFor="return-measure-description">Omschrijving *</Label>
				<Textarea
					ref={props.descriptionRef}
					id="return-measure-description"
					value={props.description}
					onChange={(event) => props.onDescriptionChange(event.target.value)}
					placeholder="Bijv. Spijbelen NE 16/09"
					rows={3}
					className="focus-visible:ring-0 focus-visible:ring-offset-0"
				/>
			</Field>

			<Field className="w-fit">
				<Label htmlFor="return-measure-day-count">Aantal dagen *</Label>
				<Input
					id="return-measure-day-count"
					type="number"
					min={1}
					step={1}
					inputMode="numeric"
					value={props.dayCount}
					onChange={(event) => props.onDayCountChange(event.target.value)}
					className="w-16 px-2 text-center"
				/>
			</Field>

			<p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{summary}</p>
		</div>
	);
}
