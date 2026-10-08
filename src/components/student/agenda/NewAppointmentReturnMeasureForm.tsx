'use client';

import type { RefObject } from 'react';
import { DateAndTimeRangePicker } from '@/components/ui/date-and-time-range-picker';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { buildAgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { isReturnMeasureDateInPast } from '@/lib/return-measure/scheduleBounds';
import { formatReturnMeasureSummary } from '@/lib/return-measure/summary';

interface NewAppointmentReturnMeasureFormProps {
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

export default function NewAppointmentReturnMeasureForm({
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
}: NewAppointmentReturnMeasureFormProps) {
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
				disabledDates={isReturnMeasureDateInPast}
			/>

			<Field>
				<Label htmlFor="return-measure-description">Omschrijving *</Label>
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
				<Label htmlFor="return-measure-day-count">Aantal dagen *</Label>
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
