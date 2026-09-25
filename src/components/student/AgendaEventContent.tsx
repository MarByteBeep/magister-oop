'use client';

import type { CSSProperties, RefObject } from 'react';
import { LuClock3, LuMapPin } from 'react-icons/lu';
import LessonHourBadge from '@/components/LessonHourBadge';
import { useFittingLineCount } from '@/hooks/useFittingLineCount';
import type { AgendaEventDisplay } from '@/lib/agendaEventDisplay';
import { formatTime } from '@/lib/dateUtils';
import { getFullDayScheduleLabel } from '@/lib/fullDayScheduleUtils';
import { cn } from '@/lib/utils';
import { ReturnMeasureAlertBadge } from './ReturnMeasureAgendaLabels';

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
	return (
		<LessonHourBadge
			lessonInfo={{ status: 'lesson', lesson: lessonBegin }}
			className="h-3.5 w-3.5 shrink-0 text-[0.55rem]"
		/>
	);
}

function LessonHourBadgeDefault({ lessonBegin }: { lessonBegin: number }) {
	return (
		<LessonHourBadge
			lessonInfo={{ status: 'lesson', lesson: lessonBegin }}
			className="h-4 w-4 text-[0.65rem] shrink-0"
		/>
	);
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

function CompactLessonTitle({ display }: { display: AgendaEventDisplay }) {
	return (
		<>
			<span className={titleClasses(display.canWrapTitle)}>{display.title}</span>
			{display.teacherLabel && <span className="truncate text-muted-foreground">{display.teacherLabel}</span>}
		</>
	);
}

export function CompactAgendaEventContent({
	display,
	gutterContentRef,
}: {
	display: AgendaEventDisplay;
	gutterContentRef: RefObject<HTMLDivElement | null>;
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
				{display.isLesson && display.lessonBegin && <LessonHourBadgeSmall lessonBegin={display.lessonBegin} />}
				{display.isGutterOverlay ? (
					<GutterTitle title={display.title} gutterContentRef={gutterContentRef} />
				) : (
					<CompactLessonTitle display={display} />
				)}
			</div>
		</>
	);
}

export function ExpandedAgendaEventContent({ display }: { display: AgendaEventDisplay }) {
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
				{display.isLesson && display.lessonBegin && (
					<LessonHourBadgeDefault lessonBegin={display.lessonBegin} />
				)}
				<span className={titleClasses(display.canWrapTitle)}>{display.title}</span>
				{display.teacherLabel && <span className="truncate text-muted-foreground">{display.teacherLabel}</span>}
			</div>
		</>
	);
}
