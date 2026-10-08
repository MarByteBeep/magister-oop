'use client';

import { cva } from 'class-variance-authority';
import { memo, useRef } from 'react';
import {
	CompactAgendaEventContent,
	ExpandedAgendaEventContent,
	FullDayReturnMeasureContent,
} from '@/components/student/agenda/AgendaEventContent';
import AgendaTooltipContent from '@/components/student/agenda/AgendaTooltipContent';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { isReturnMeasureEntry } from '@/lib/agenda/entryUtils';
import { resolveAgendaEventDisplay } from '@/lib/agenda/eventDisplay';
import {
	absenceSurfaceClasses,
	returnMeasureGhostSurfaceClasses,
	returnMeasureSourceSurfaceClasses,
	returnMeasureSurfaceClasses,
} from '@/lib/agenda/kindStyles';
import { cn, deepEqual } from '@/lib/utils';
import type { AgendaEntry, RegistrationAgendaEntry } from '@/magister/response/agendaEntry.types';

const agendaEventStyles = cva(
	'relative h-full overflow-hidden cursor-pointer rounded-lg border text-[12px] text-foreground duration-150 focus-visible:outline-none',
	{
		variants: {
			kind: {
				lesson: 'mx-1',
				returnMeasureFullDay: 'mx-0',
				returnMeasureGutter: 'mx-1',
				absenceNotice: `mx-1 ${absenceSurfaceClasses}`,
			},
			returnMeasureTone: {
				solid: returnMeasureSurfaceClasses,
				ghost: returnMeasureGhostSurfaceClasses,
				source: returnMeasureSourceSurfaceClasses,
				none: '',
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
				returnMeasureTone: 'solid',
				className: returnMeasureSurfaceClasses,
			},
			{
				kind: 'returnMeasureGutter',
				active: false,
				returnMeasureTone: 'solid',
				className: returnMeasureSurfaceClasses,
			},
			{
				kind: 'returnMeasureFullDay',
				active: false,
				returnMeasureTone: 'ghost',
				className: returnMeasureGhostSurfaceClasses,
			},
			{
				kind: 'returnMeasureGutter',
				active: false,
				returnMeasureTone: 'ghost',
				className: returnMeasureGhostSurfaceClasses,
			},
			{
				kind: 'returnMeasureFullDay',
				active: false,
				returnMeasureTone: 'source',
				className: returnMeasureSourceSurfaceClasses,
			},
			{
				kind: 'returnMeasureGutter',
				active: false,
				returnMeasureTone: 'source',
				className: returnMeasureSourceSurfaceClasses,
			},
			{
				kind: 'absenceNotice',
				active: false,
				className: absenceSurfaceClasses,
			},
		],
		defaultVariants: {
			kind: 'lesson',
			returnMeasureTone: 'none',
		},
	},
);

type ReturnMeasureTone = 'solid' | 'ghost' | 'source' | 'none';

function resolveReturnMeasureTone(
	entry: AgendaEntry,
	ghostReturnMeasure: boolean,
	focusReturnMeasureId: number | null,
): ReturnMeasureTone {
	if (!isReturnMeasureEntry(entry)) return 'none';
	if (focusReturnMeasureId != null) {
		return entry.measure.id === focusReturnMeasureId ? 'source' : 'ghost';
	}
	return ghostReturnMeasure ? 'ghost' : 'solid';
}

interface AgendaEventProps {
	entry: AgendaEntry;
	registrations?: RegistrationAgendaEntry[];
	onSelectRegistration?: (entry: RegistrationAgendaEntry) => void;
	isActive?: boolean;
	isCompact?: boolean;
	/** Ghost existing measures while planning a new slot (same hue as selection, lower presence). */
	ghostReturnMeasure?: boolean;
	/** When set, this measure is the red source; other return measures stay ghosted. */
	focusReturnMeasureId?: number | null;
}

function AgendaEvent({
	entry,
	registrations,
	onSelectRegistration,
	isActive = false,
	isCompact = false,
	ghostReturnMeasure = false,
	focusReturnMeasureId = null,
}: AgendaEventProps) {
	const display = resolveAgendaEventDisplay(entry, isCompact, isActive);
	const gutterContentRef = useRef<HTMLDivElement>(null);
	const returnMeasureTone = resolveReturnMeasureTone(entry, ghostReturnMeasure, focusReturnMeasureId);

	const frame = (
		<div
			className={cn(
				agendaEventStyles({
					kind: display.kind,
					returnMeasureTone,
					active: display.isActiveStyle,
					compact: display.isCompact,
				}),
			)}
		>
			{display.isFullDayReturnMeasure ? (
				<FullDayReturnMeasureContent display={display} />
			) : display.isCompact ? (
				<CompactAgendaEventContent
					entry={entry}
					display={display}
					gutterContentRef={gutterContentRef}
					registrations={registrations}
					onSelectRegistration={onSelectRegistration}
				/>
			) : (
				<ExpandedAgendaEventContent
					entry={entry}
					display={display}
					registrations={registrations}
					onSelectRegistration={onSelectRegistration}
				/>
			)}
		</div>
	);

	if (display.isLesson) return frame;

	return (
		<Tooltip>
			<TooltipTrigger asChild>{frame}</TooltipTrigger>
			<TooltipContent>
				<AgendaTooltipContent entry={entry} />
			</TooltipContent>
		</Tooltip>
	);
}

export default memo(
	AgendaEvent,
	(prev, next) =>
		prev.isCompact === next.isCompact &&
		prev.isActive === next.isActive &&
		prev.ghostReturnMeasure === next.ghostReturnMeasure &&
		prev.focusReturnMeasureId === next.focusReturnMeasureId &&
		prev.onSelectRegistration === next.onSelectRegistration &&
		deepEqual(prev.registrations, next.registrations) &&
		deepEqual(prev.entry, next.entry),
);
