'use client';

import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDateKey, parseDateKey } from '@/lib/dateUtils';

interface DateAndTimeRangePickerProps {
	dateKey: string;
	startTime: string;
	endTime: string;
	onDateKeyChange: (dateKey: string) => void;
	onStartTimeChange: (time: string) => void;
	onEndTimeChange: (time: string) => void;
	dateId?: string;
	startTimeId?: string;
	endTimeId?: string;
	popoverContainer?: HTMLElement | null;
	onDatePickerOpenChange?: (open: boolean) => void;
}

export function DateAndTimeRangePicker({
	dateKey,
	startTime,
	endTime,
	onDateKeyChange,
	onStartTimeChange,
	onEndTimeChange,
	dateId = 'schedule-date',
	startTimeId = 'schedule-start-time',
	endTimeId = 'schedule-end-time',
	popoverContainer,
	onDatePickerOpenChange,
}: DateAndTimeRangePickerProps) {
	const selectedDate = dateKey ? parseDateKey(dateKey) : undefined;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex w-full flex-col gap-2">
				<Label htmlFor={dateId} className="px-1">
					Datum
				</Label>
				<DatePicker
					id={dateId}
					value={selectedDate}
					onChange={(date) => onDateKeyChange(getDateKey(date))}
					popoverContainer={popoverContainer}
					onOpenChange={onDatePickerOpenChange}
				/>
			</div>

			<div className="flex gap-4">
				<div className="flex flex-1 flex-col gap-2">
					<Label htmlFor={startTimeId} className="px-1">
						Begintijd
					</Label>
					<Input
						type="time"
						id={startTimeId}
						value={startTime}
						onChange={(event) => onStartTimeChange(event.target.value)}
						className="bg-background"
					/>
				</div>
				<div className="flex flex-1 flex-col gap-2">
					<Label htmlFor={endTimeId} className="px-1">
						Eindtijd
					</Label>
					<Input
						type="time"
						id={endTimeId}
						value={endTime}
						onChange={(event) => onEndTimeChange(event.target.value)}
						className="bg-background"
					/>
				</div>
			</div>
		</div>
	);
}
