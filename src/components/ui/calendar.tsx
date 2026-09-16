'use client';

import { isBefore, startOfDay } from 'date-fns';
import type * as React from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { nl } from 'react-day-picker/locale';

import { cn } from '@/lib/utils';

import 'react-day-picker/style.css';
import './calendar.css';

function isPastDate(date: Date) {
	return isBefore(date, startOfDay(new Date()));
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const defaultClassNames = getDefaultClassNames();

const calendarClassNames = {
	...defaultClassNames,
	root: cn(defaultClassNames.root, 'p-2'),
	day_button: cn(defaultClassNames.day_button, 'rounded', 'hover:bg-primary hover:text-primary-foreground'),
};

const pastModifiers = { past: isPastDate };
const pastModifiersClassNames = {
	past: 'text-muted-foreground',
};

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	modifiers: propsModifiers,
	modifiersClassNames: propsModifiersClassNames,
	...props
}: CalendarProps) {
	return (
		<DayPicker
			locale={nl}
			weekStartsOn={1}
			navLayout="around"
			className={cn('rdp-root', calendarClassNames.root, className)}
			classNames={{
				...calendarClassNames,
				...classNames,
			}}
			showOutsideDays={showOutsideDays}
			modifiers={{ ...pastModifiers, ...propsModifiers }}
			modifiersClassNames={{ ...pastModifiersClassNames, ...propsModifiersClassNames }}
			{...props}
		/>
	);
}
Calendar.displayName = 'Calendar';

export { Calendar };
