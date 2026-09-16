'use client';

import { useState } from 'react';
import { nl } from 'react-day-picker/locale';
import { LuChevronDown } from 'react-icons/lu';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

function formatPickerDate(date: Date): string {
	return date.toLocaleDateString('nl-NL', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
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
	const [open, setOpen] = useState(false);
	const selectedDate = dateKey ? parseDateKey(dateKey) : undefined;

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		onDatePickerOpenChange?.(nextOpen);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex w-full flex-col gap-2">
				<Label htmlFor={dateId} className="px-1">
					Datum
				</Label>
				<Popover modal open={open} onOpenChange={handleOpenChange}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							id={dateId}
							data-empty={!selectedDate}
							className="w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
						>
							{selectedDate ? formatPickerDate(selectedDate) : 'Kies een datum'}
							<LuChevronDown className="size-4 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent
						container={popoverContainer}
						className="z-[100] w-auto p-0"
						align="start"
						onOpenAutoFocus={(event) => event.preventDefault()}
					>
						<Calendar
							mode="single"
							locale={nl}
							selected={selectedDate}
							defaultMonth={selectedDate}
							onSelect={(date) => {
								if (!date) return;
								onDateKeyChange(getDateKey(date));
								handleOpenChange(false);
							}}
						/>
					</PopoverContent>
				</Popover>
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
						className="cursor-pointer bg-background"
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
						className="cursor-pointer bg-background"
					/>
				</div>
			</div>
		</div>
	);
}
