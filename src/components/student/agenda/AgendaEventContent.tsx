'use client';

import type { CSSProperties, ReactNode, RefObject } from 'react';
import { LuClock3, LuMapPin } from 'react-icons/lu';
import RegistrationIcon from '@/components/registrations/RegistrationIcon';
import AgendaTooltipContent from '@/components/student/agenda/AgendaTooltipContent';
import LessonHourBadge from '@/components/student/agenda/LessonHourBadge';
import { ReturnMeasureAlertBadge } from '@/components/student/agenda/ReturnMeasureAgendaLabels';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFittingLineCount } from '@/hooks/shared/useFittingLineCount';
import type { AgendaEventDisplay } from '@/lib/agenda/eventDisplay';
import { getFullDayScheduleLabel } from '@/lib/agenda/fullDayScheduleUtils';
import { formatTime } from '@/lib/shared/dateUtils';
import { cn } from '@/lib/utils';
import type { AgendaEntry, RegistrationAgendaEntry } from '@/magister/response/agendaEntry.types';

const metaInfoClasses = 'absolute right-1.5 flex items-center gap-1 text-[9px] text-muted-foreground';
const topMetaInfoClasses = `${metaInfoClasses} top-0.5`;
const topLeftMetaInfoClasses = 'absolute left-1 top-0.5';
const fullDayScheduleHeaderClasses =
	'absolute left-1 top-0.5 z-10 flex max-w-[calc(100%-0.5rem)] items-center gap-1 text-[11px] font-semibold text-foreground';
const bottomMetaInfoClasses = `${metaInfoClasses} bottom-0.5`;
const metaIconClasses = 'h-2.5 w-2.5 shrink-0';
const locationTextClasses = 'max-w-14 truncate';
const compactContentClasses = 'flex h-full min-w-0 items-center gap-1';
const gutterContentClasses = 'flex h-full min-w-0 flex-col justify-start overflow-hidden pt-0.5 pb-0.5';
const defaultContentClasses = 'flex h-full min-w-0 items-center gap-1 pr-16';

function titleClasses(canWrapTitle: boolean) {
	return cn(
		'min-w-0 font-semibold text-foreground',
		canWrapTitle ? 'line-clamp-2 whitespace-normal break-words leading-tight' : 'truncate',
	);
}

function gutterTitleStyle(maxLines: number): CSSProperties {
	return {
		display: '-webkit-box',
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: maxLines,
		overflow: 'hidden',
	};
}

function gutterTitleClasses() {
	return 'min-w-0 w-full break-words leading-tight font-semibold text-foreground';
}

function LessonHourBadgeSmall({ lessonBegin }: { lessonBegin: number }) {
	return <LessonHourBadge hour={lessonBegin} size="sm" />;
}

function LessonHourBadgeDefault({ lessonBegin }: { lessonBegin: number }) {
	return <LessonHourBadge hour={lessonBegin} size="md" />;
}

export function FullDayReturnMeasureContent({ display }: { display: AgendaEventDisplay }) {
	return (
		<>
			<div className={fullDayScheduleHeaderClasses}>
				<ReturnMeasureAlertBadge />
				<span className="truncate">{getFullDayScheduleLabel()}</span>
			</div>
			<span className="sr-only">{display.title ?? getFullDayScheduleLabel()}</span>
		</>
	);
}

function GutterTitle({
	title,
	gutterContentRef,
}: {
	title: string | undefined;
	gutterContentRef: RefObject<HTMLDivElement | null>;
}) {
	const gutterLineCount = useFittingLineCount(gutterContentRef);
	return (
		<span className={gutterTitleClasses()} style={gutterTitleStyle(gutterLineCount)}>
			{title}
		</span>
	);
}

function LessonTextTooltip({
	entry,
	className,
	children,
}: {
	entry: AgendaEntry;
	className: string;
	children: ReactNode;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className={className}>{children}</div>
			</TooltipTrigger>
			<TooltipContent>
				<AgendaTooltipContent entry={entry} />
			</TooltipContent>
		</Tooltip>
	);
}

function LessonRegistrationIcons({
	registrations,
	onSelectRegistration,
}: {
	registrations?: RegistrationAgendaEntry[];
	onSelectRegistration?: (entry: RegistrationAgendaEntry) => void;
}) {
	if (!registrations?.length) return null;

	return (
		<span className="flex shrink-0 items-center gap-0.5">
			{registrations.map((entry) => (
				<RegistrationIcon
					key={entry.registration.id}
					registration={entry.registration}
					start={entry.start}
					end={entry.end}
					onSelect={onSelectRegistration ? () => onSelectRegistration(entry) : undefined}
				/>
			))}
		</span>
	);
}

function CompactLessonTitle({
	entry,
	display,
	registrations,
	onSelectRegistration,
}: {
	entry: AgendaEntry;
	display: AgendaEventDisplay;
	registrations?: RegistrationAgendaEntry[];
	onSelectRegistration?: (entry: RegistrationAgendaEntry) => void;
}) {
	return (
		<>
			<LessonTextTooltip entry={entry} className="flex min-w-0 items-center gap-1">
				{display.lessonBegin && <LessonHourBadgeSmall lessonBegin={display.lessonBegin} />}
				<span className={titleClasses(display.canWrapTitle)}>{display.title}</span>
				{display.teacherLabel && (
					<span className="min-w-0 truncate text-muted-foreground">{display.teacherLabel}</span>
				)}
			</LessonTextTooltip>
			<LessonRegistrationIcons registrations={registrations} onSelectRegistration={onSelectRegistration} />
		</>
	);
}

export function CompactAgendaEventContent({
	entry,
	display,
	gutterContentRef,
	registrations,
	onSelectRegistration,
}: {
	entry: AgendaEntry;
	display: AgendaEventDisplay;
	gutterContentRef: RefObject<HTMLDivElement | null>;
	registrations?: RegistrationAgendaEntry[];
	onSelectRegistration?: (entry: RegistrationAgendaEntry) => void;
}) {
	const showReturnMeasureBadge = display.returnMeasureDisplay?.hasBoth && display.isGutterOverlay;

	return (
		<>
			{showReturnMeasureBadge && (
				<div className={topLeftMetaInfoClasses}>
					<ReturnMeasureAlertBadge />
				</div>
			)}
			<div
				ref={display.isGutterOverlay ? gutterContentRef : undefined}
				className={cn(
					display.isGutterOverlay ? gutterContentClasses : compactContentClasses,
					showReturnMeasureBadge && 'pl-3',
				)}
			>
				{display.isGutterOverlay ? (
					<GutterTitle title={display.title} gutterContentRef={gutterContentRef} />
				) : (
					<CompactLessonTitle
						entry={entry}
						display={display}
						registrations={registrations}
						onSelectRegistration={onSelectRegistration}
					/>
				)}
			</div>
		</>
	);
}

export function ExpandedAgendaEventContent({
	entry,
	display,
	registrations,
	onSelectRegistration,
}: {
	entry: AgendaEntry;
	display: AgendaEventDisplay;
	registrations?: RegistrationAgendaEntry[];
	onSelectRegistration?: (entry: RegistrationAgendaEntry) => void;
}) {
	return (
		<>
			<div className={topMetaInfoClasses}>
				<LuClock3 className={metaIconClasses} />
				<span>
					{formatTime(display.beginTime)} - {formatTime(display.endTime)}
				</span>
			</div>

			{display.isLesson && display.firstLocation && (
				<div className={bottomMetaInfoClasses}>
					<LuMapPin className={metaIconClasses} />
					<span className={locationTextClasses}>{display.firstLocation}</span>
				</div>
			)}

			<div className={defaultContentClasses}>
				<LessonTextTooltip entry={entry} className="flex min-w-0 items-center gap-1">
					{display.isLesson && display.lessonBegin && (
						<LessonHourBadgeDefault lessonBegin={display.lessonBegin} />
					)}
					<span className={titleClasses(display.canWrapTitle)}>{display.title}</span>
					{display.teacherLabel && (
						<span className="min-w-0 truncate text-muted-foreground">{display.teacherLabel}</span>
					)}
				</LessonTextTooltip>
				<LessonRegistrationIcons registrations={registrations} onSelectRegistration={onSelectRegistration} />
			</div>
		</>
	);
}
