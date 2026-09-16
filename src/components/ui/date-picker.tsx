'use client';

import { useState } from 'react';
import { nl } from 'react-day-picker/locale';
import { LuCalendar, LuChevronDown } from 'react-icons/lu';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
	id?: string;
	value?: Date;
	placeholder?: string;
	onChange: (date: Date) => void;
	popoverContainer?: HTMLElement | null;
	onOpenChange?: (open: boolean) => void;
	className?: string;
}

function formatPickerDate(date: Date): string {
	return date.toLocaleDateString('nl-NL', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

export function DatePicker({
	id,
	value,
	placeholder = 'Kies een datum',
	onChange,
	popoverContainer,
	onOpenChange,
	className,
}: DatePickerProps) {
	const [open, setOpen] = useState(false);

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		onOpenChange?.(nextOpen);
	};

	return (
		<Popover modal open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					id={id}
					data-empty={!value}
					className={cn(
						'w-full justify-start gap-2 text-left font-normal data-[empty=true]:text-muted-foreground',
						className,
					)}
				>
					<LuCalendar className="size-4 shrink-0 opacity-70" />
					<span className="min-w-0 flex-1 truncate">{value ? formatPickerDate(value) : placeholder}</span>
					<LuChevronDown className="size-4 shrink-0 opacity-50" />
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
					selected={value}
					defaultMonth={value}
					onSelect={(date) => {
						if (!date) return;
						onChange(date);
						handleOpenChange(false);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}
