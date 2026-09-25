import type * as React from 'react';
import { LuClock3 } from 'react-icons/lu';

import { cn } from '@/lib/utils';

const inputClassName = cn(
	'peer flex h-9 w-full min-w-0 rounded-md border bg-background px-3 py-1 text-sm shadow-xs outline-none',
	'placeholder:text-muted-foreground',
	'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
	'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
	'dark:border-input dark:bg-input/30',
);

const timeInputClassName = cn(
	inputClassName,
	'pl-9 focus-visible:ring-0 focus-visible:ring-offset-0',
	'[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
	'appearance-none [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden',
);

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	if (type === 'time') {
		return (
			<div className="relative">
				<LuClock3
					className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-70"
					aria-hidden
				/>
				<input type="time" data-slot="input" className={cn(timeInputClassName, className)} {...props} />
			</div>
		);
	}

	return <input type={type} data-slot="input" className={cn(inputClassName, className)} {...props} />;
}

export { Input };
