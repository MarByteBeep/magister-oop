'use client';

import { cva } from 'class-variance-authority';
import { memo, useRef } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { resolveAgendaEventDisplay } from '@/lib/agendaEventDisplay';
import { absenceSurfaceClasses, returnMeasureSurfaceClasses } from '@/lib/agendaKindStyles';
import { cn, deepEqual } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import {
	CompactAgendaEventContent,
	ExpandedAgendaEventContent,
	FullDayReturnMeasureContent,
} from './AgendaEventContent';
import AgendaTooltipContent from './AgendaTooltipContent';

const agendaEventStyles = cva(
	'relative h-full overflow-hidden cursor-pointer rounded-lg border text-[12px] text-foreground duration-150 focus-visible:outline-none',
	{
		variants: {
			kind: {
				lesson: 'mx-1',
				returnMeasureFullDay: `mx-0 ${returnMeasureSurfaceClasses}`,
				returnMeasureGutter: `mx-1 ${returnMeasureSurfaceClasses}`,
				absenceNotice: `mx-1 ${absenceSurfaceClasses}`,
			},
			active: {
				true: 'bg-emerald-500/48 border-emerald-500/70',
				false: 'bg-primary/10 border-border shadow-sm shadow-black/8 hover:bg-primary/18 hover:border-primary/70 dark:bg-muted/85 dark:border-border dark:shadow-sm dark:shadow-black/20 dark:hover:bg-primary/22 dark:hover:border-primary/85',
			},
			compact: {
				true: 'px-1 py-0.5 leading-tight',
				false: 'px-1.5 py-0 leading-none whitespace-nowrap',
			},
		},
		compoundVariants: [
			{
				kind: 'returnMeasureFullDay',
				active: false,
				className: returnMeasureSurfaceClasses,
			},
			{
				kind: 'returnMeasureGutter',
				active: false,
				className: returnMeasureSurfaceClasses,
			},
			{
				kind: 'absenceNotice',
				active: false,
				className: absenceSurfaceClasses,
			},
		],
		defaultVariants: {
			kind: 'lesson',
		},
	},
);

interface AgendaEventProps {
	entry: AgendaEntry;
	isActive?: boolean;
	isCompact?: boolean;
}

function AgendaEvent({ entry, isActive = false, isCompact = false }: AgendaEventProps) {
	const display = resolveAgendaEventDisplay(entry, isCompact, isActive);
	const gutterContentRef = useRef<HTMLDivElement>(null);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					className={cn(
						agendaEventStyles({
							kind: display.kind,
							active: display.isActiveStyle,
							compact: display.isCompact,
						}),
					)}
				>
					{display.isFullDayReturnMeasure ? (
						<FullDayReturnMeasureContent display={display} />
					) : display.isCompact ? (
						<CompactAgendaEventContent display={display} gutterContentRef={gutterContentRef} />
					) : (
						<ExpandedAgendaEventContent display={display} />
					)}
				</div>
			</TooltipTrigger>
			<TooltipContent>
				<AgendaTooltipContent entry={entry} />
			</TooltipContent>
		</Tooltip>
	);
}

export default memo(
	AgendaEvent,
	(prev, next) =>
		prev.isCompact === next.isCompact && prev.isActive === next.isActive && deepEqual(prev.entry, next.entry),
);
