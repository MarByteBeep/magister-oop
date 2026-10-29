'use client';

import { cva } from 'class-variance-authority';
import { memo, useRef } from 'react';
import {
	CompactAgendaEventContent,
	ExpandedAgendaEventContent,
	FullDayReturnMeasureContent,
} from '@/components/student/agenda/calendar/AgendaEventContent';
import AgendaTooltipContent from '@/components/student/agenda/calendar/AgendaTooltipContent';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { type AgendaEventDisplay, resolveAgendaEventDisplay } from '@/lib/agenda/eventDisplay';
import { absenceSurfaceClasses, returnMeasureSurfaceClasses } from '@/lib/agenda/kindStyles';
import { cn, deepEqual } from '@/lib/utils';
import type { AgendaEntry, RegistrationAgendaEntry } from '@/magister/response/agendaEntry.types';

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
	registrations?: RegistrationAgendaEntry[];
	onSelectRegistration?: (entry: RegistrationAgendaEntry) => void;
	isActive?: boolean;
	isCompact?: boolean;
}

function AgendaEventBody(props: {
	entry: AgendaEntry;
	display: AgendaEventDisplay;
	registrations?: RegistrationAgendaEntry[];
	onSelectRegistration?: (entry: RegistrationAgendaEntry) => void;
	gutterContentRef: React.RefObject<HTMLDivElement | null>;
}) {
	if (props.display.isFullDayReturnMeasure) return <FullDayReturnMeasureContent display={props.display} />;
	if (props.display.isCompact) {
		return (
			<CompactAgendaEventContent
				entry={props.entry}
				display={props.display}
				gutterContentRef={props.gutterContentRef}
				registrations={props.registrations}
				onSelectRegistration={props.onSelectRegistration}
			/>
		);
	}
	return (
		<ExpandedAgendaEventContent
			entry={props.entry}
			display={props.display}
			registrations={props.registrations}
			onSelectRegistration={props.onSelectRegistration}
		/>
	);
}

function AgendaEventFrame(props: {
	entry: AgendaEntry;
	display: AgendaEventDisplay;
	registrations?: RegistrationAgendaEntry[];
	onSelectRegistration?: (entry: RegistrationAgendaEntry) => void;
}) {
	const gutterContentRef = useRef<HTMLDivElement>(null);
	return (
		<div
			className={cn(
				agendaEventStyles({
					kind: props.display.kind,
					active: props.display.isActiveStyle,
					compact: props.display.isCompact,
				}),
			)}
		>
			<AgendaEventBody
				entry={props.entry}
				display={props.display}
				registrations={props.registrations}
				onSelectRegistration={props.onSelectRegistration}
				gutterContentRef={gutterContentRef}
			/>
		</div>
	);
}

function AgendaEvent(props: AgendaEventProps) {
	const isActive = props.isActive === true;
	const isCompact = props.isCompact === true;
	const display = resolveAgendaEventDisplay(props.entry, isCompact, isActive);
	const frame = (
		<AgendaEventFrame
			entry={props.entry}
			display={display}
			registrations={props.registrations}
			onSelectRegistration={props.onSelectRegistration}
		/>
	);

	if (display.isLesson) return frame;

	return (
		<Tooltip>
			<TooltipTrigger asChild>{frame}</TooltipTrigger>
			<TooltipContent>
				<AgendaTooltipContent entry={props.entry} />
			</TooltipContent>
		</Tooltip>
	);
}

function sameAgendaEventPrimitives(prev: AgendaEventProps, next: AgendaEventProps): boolean {
	if (prev.isCompact !== next.isCompact) return false;
	if (prev.isActive !== next.isActive) return false;
	return prev.onSelectRegistration === next.onSelectRegistration;
}

function agendaEventPropsEqual(prev: AgendaEventProps, next: AgendaEventProps): boolean {
	if (!sameAgendaEventPrimitives(prev, next)) return false;
	if (!deepEqual(prev.registrations, next.registrations)) return false;
	return deepEqual(prev.entry, next.entry);
}

export default memo(AgendaEvent, agendaEventPropsEqual);
