'use client';

import type { CSSProperties, ReactNode, RefObject } from 'react';
import { LuClock3, LuMapPin } from 'react-icons/lu';
import RegistrationIcon from '@/components/registrations/RegistrationIcon';
import AgendaTooltipContent from '@/components/student/agenda/calendar/AgendaTooltipContent';
import LessonHourBadge from '@/components/student/agenda/calendar/LessonHourBadge';
import { ReturnMeasureAlertBadge } from '@/components/student/agenda/calendar/ReturnMeasureAgendaLabels';
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

function showReturnMeasureBadge(display: AgendaEventDisplay): boolean {
	if (!display.isGutterOverlay) return false;
	const measureDisplay = display.returnMeasureDisplay;
	if (measureDisplay === null) return false;
	return measureDisplay.hasBoth;
}

function compactBodyClassName(isGutterOverlay: boolean, withBadgePadding: boolean): string {
	const base = isGutterOverlay ? gutterContentClasses : compactContentClasses;
	if (!withBadgePadding) return base;
	return cn(base, 'pl-3');
}

function showExpandedLocation(display: AgendaEventDisplay): boolean {
	if (!display.isLesson) return false;
	return Boolean(display.firstLocation);
}

function gutterContentRefOrUndefined(
	isGutterOverlay: boolean,
	gutterContentRef: RefObject<HTMLDivElement | null>,
): RefObject<HTMLDivElement | null> | undefined {
	if (!isGutterOverlay) return undefined;
	return gutterContentRef;
}

function LessonHourBadgeSmall({ lessonBegin }: { lessonBegin: number }) {
	return <LessonHourBadge hour={lessonBegin} size="sm" />;
}

function LessonHourBadgeDefault({ lessonBegin }: { lessonBegin: number }) {
	return <LessonHourBadge hour={lessonBegin} size="md" />;
}

function fullDaySrOnlyTitle(title: string | undefined): string {
	if (title !== undefined) return title;
	return getFullDayScheduleLabel();
}

export function FullDayReturnMeasureContent({ display }: { display: AgendaEventDisplay }) {
	return (
		<>
			<div className={fullDayScheduleHeaderClasses}>
				<ReturnMeasureAlertBadge />
				<span className="truncate">{getFullDayScheduleLabel()}</span>
			</div>
			<span className="sr-only">{fullDaySrOnlyTitle(display.title)}</span>
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

function registrationSelectHandler(
	entry: RegistrationAgendaEntry,
	onSelectRegistration: ((entry: RegistrationAgendaEntry) => void) | undefined,
): (() => void) | undefined {
	if (!onSelectRegistration) return undefined;
	return () => onSelectRegistration(entry);
}

function LessonRegistrationIcons({
	registrations,
	onSelectRegistration,
}: {
	registrations?: RegistrationAgendaEntry[];
	onSelectRegistration?: (entry: RegistrationAgendaEntry) => void;
}) {
	if (!registrations) return null;
	if (registrations.length === 0) return null;

	return (
		<span className="flex shrink-0 items-center gap-0.5">
			{registrations.map((entry) => (
				<RegistrationIcon
					key={entry.registration.id}
					registration={entry.registration}
					start={entry.start}
					end={entry.end}
					onSelect={registrationSelectHandler(entry, onSelectRegistration)}
				/>
			))}
		</span>
	);
}

function CompactLessonBadge({ lessonBegin }: { lessonBegin: number | undefined }) {
	if (lessonBegin === undefined) return null;
	return <LessonHourBadgeSmall lessonBegin={lessonBegin} />;
}

function TeacherLabel({ teacherLabel }: { teacherLabel: string | undefined }) {
	if (!teacherLabel) return null;
	return <span className="min-w-0 truncate text-muted-foreground">{teacherLabel}</span>;
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
				<CompactLessonBadge lessonBegin={display.lessonBegin} />
				<span className={titleClasses(display.canWrapTitle)}>{display.title}</span>
				<TeacherLabel teacherLabel={display.teacherLabel} />
			</LessonTextTooltip>
			<LessonRegistrationIcons registrations={registrations} onSelectRegistration={onSelectRegistration} />
		</>
	);
}

function ReturnMeasureBadgeOverlay({ show }: { show: boolean }) {
	if (!show) return null;
	return (
		<div className={topLeftMetaInfoClasses}>
			<ReturnMeasureAlertBadge />
		</div>
	);
}

function CompactEventBody({
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
	if (display.isGutterOverlay) {
		return <GutterTitle title={display.title} gutterContentRef={gutterContentRef} />;
	}

	return (
		<CompactLessonTitle
			entry={entry}
			display={display}
			registrations={registrations}
			onSelectRegistration={onSelectRegistration}
		/>
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
	const withBadge = showReturnMeasureBadge(display);

	return (
		<>
			<ReturnMeasureBadgeOverlay show={withBadge} />
			<div
				ref={gutterContentRefOrUndefined(display.isGutterOverlay, gutterContentRef)}
				className={compactBodyClassName(display.isGutterOverlay, withBadge)}
			>
				<CompactEventBody
					entry={entry}
					display={display}
					gutterContentRef={gutterContentRef}
					registrations={registrations}
					onSelectRegistration={onSelectRegistration}
				/>
			</div>
		</>
	);
}

function ExpandedLocationRow({ display }: { display: AgendaEventDisplay }) {
	if (!showExpandedLocation(display)) return null;

	return (
		<div className={bottomMetaInfoClasses}>
			<LuMapPin className={metaIconClasses} />
			<span className={locationTextClasses}>{display.firstLocation}</span>
		</div>
	);
}

function ExpandedLessonBadge({ lessonBegin }: { lessonBegin: number | undefined }) {
	if (lessonBegin === undefined) return null;
	return <LessonHourBadgeDefault lessonBegin={lessonBegin} />;
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

			<ExpandedLocationRow display={display} />

			<div className={defaultContentClasses}>
				<LessonTextTooltip entry={entry} className="flex min-w-0 items-center gap-1">
					<ExpandedLessonBadge lessonBegin={display.lessonBegin} />
					<span className={titleClasses(display.canWrapTitle)}>{display.title}</span>
					<TeacherLabel teacherLabel={display.teacherLabel} />
				</LessonTextTooltip>
				<LessonRegistrationIcons registrations={registrations} onSelectRegistration={onSelectRegistration} />
			</div>
		</>
	);
}
