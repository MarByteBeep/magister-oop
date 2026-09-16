import type { CSSProperties } from 'react';
import type { DayLayoutFunction } from 'react-big-calendar';
// RBC ships layout helpers as CJS; used to pack lessons without overlay items.
import noOverlap from 'react-big-calendar/lib/utils/layout-algorithms/no-overlap.js';
import {
	type CalendarEvent,
	isBackgroundOverlayCalendarEvent,
	isBreakCalendarEvent,
	isSameCalendarDay,
} from '@/lib/agendaCalendarUtils';
import { isAbsenceNoticeEntry, isReturnMeasureEntry } from '@/lib/agendaEntryUtils';
import { isFullDayReturnMeasureEntry, isFullDayScheduleSelection } from '@/lib/fullDayScheduleUtils';

type LayoutStyle = CSSProperties & {
	top: number;
	height: number | string;
	width: number | string;
	xOffset: number | string;
};

type StyledEvent = {
	event: CalendarEvent;
	style: LayoutStyle;
};

/** Share of the day column reserved for side-gutter entries (absences, partial return measures). */
export const AGENDA_SIDE_GUTTER_PERCENT = 34;

function cssLength(value: number | string): string {
	return typeof value === 'string' ? value : `${value}%`;
}

export function scaleLayoutToGutter(style: LayoutStyle, gutterPercent: number): LayoutStyle {
	const factor = gutterPercent / 100;
	return {
		...style,
		width: `calc((${cssLength(style.width)}) * ${factor})`,
		xOffset: `calc((${cssLength(style.xOffset)}) * ${factor})`,
	};
}

export function shiftLayoutForGutter(style: LayoutStyle, gutterPercent: number): LayoutStyle {
	const factor = (100 - gutterPercent) / 100;
	return {
		...style,
		width: `calc((${cssLength(style.width)}) * ${factor})`,
		xOffset: `calc(${gutterPercent}% + (${cssLength(style.xOffset)}) * ${factor})`,
	};
}

function eventsOverlap(a: CalendarEvent, b: CalendarEvent): boolean {
	return isSameCalendarDay(a.start, b.start) && a.start < b.end && a.end > b.start;
}

function eventsAreBackToBack(a: CalendarEvent, b: CalendarEvent): boolean {
	return a.end.getTime() === b.start.getTime();
}

function toPercent(value: number | string): number {
	return typeof value === 'number' ? value : Number.parseFloat(value);
}

/** Prevent short bands from bleeding into the next slot because of subpixel rounding. */
function snapTimedBoundaries(styledEvents: StyledEvent[]): StyledEvent[] {
	if (styledEvents.length < 2) return styledEvents;

	const sorted = [...styledEvents].sort((left, right) => toPercent(left.style.top) - toPercent(right.style.top));

	for (let index = 0; index < sorted.length - 1; index++) {
		const current = sorted[index];
		const next = sorted[index + 1];
		if (!current || !next || !eventsAreBackToBack(current.event, next.event)) continue;

		const currentTop = toPercent(current.style.top);
		const nextTop = toPercent(next.style.top);
		const currentBottom = currentTop + toPercent(current.style.height);

		if (currentBottom > nextTop) {
			sorted[index] = {
				...current,
				style: {
					...current.style,
					height: nextTop - currentTop,
				},
			};
		}
	}

	return sorted;
}

/** RBC no-overlap trims 2px off height; restore exact timetable bounds so slots meet flush. */
function restoreTimedBounds(
	styled: StyledEvent,
	slotMetrics: Parameters<DayLayoutFunction<CalendarEvent>>[0]['slotMetrics'],
	accessors: Parameters<DayLayoutFunction<CalendarEvent>>[0]['accessors'],
): StyledEvent {
	const range = slotMetrics.getRange(accessors.start(styled.event), accessors.end(styled.event));
	return {
		...styled,
		style: {
			...styled.style,
			top: range.top,
			height: range.height,
		},
	};
}

function timedStyleFromEvent(
	event: CalendarEvent,
	slotMetrics: Parameters<DayLayoutFunction<CalendarEvent>>[0]['slotMetrics'],
	accessors: Parameters<DayLayoutFunction<CalendarEvent>>[0]['accessors'],
	horizontal?: Pick<LayoutStyle, 'width' | 'xOffset'>,
): LayoutStyle {
	const range = slotMetrics.getRange(accessors.start(event), accessors.end(event));
	return {
		top: range.top,
		height: range.height,
		width: horizontal?.width ?? 100,
		xOffset: horizontal?.xOffset ?? 0,
	};
}

/**
 * Pack lessons with no-overlap. Full-day return measures ("vierkant rooster") stay full-width behind.
 * Absences and partial return measures use the left gutter beside overlapping lessons,
 * or full row width when no lesson overlaps that time slot.
 */
export const agendaDayLayoutAlgorithm: DayLayoutFunction<CalendarEvent> = ({
	events,
	minimumStartDifference,
	slotMetrics,
	accessors,
}) => {
	const lessons: CalendarEvent[] = [];
	const fullDayReturnMeasures: CalendarEvent[] = [];
	const gutterOverlays: CalendarEvent[] = [];
	const partialDraftEvents: CalendarEvent[] = [];
	const fullDayDraftEvents: CalendarEvent[] = [];
	const breakEvents: CalendarEvent[] = [];

	for (const event of events) {
		if (isBackgroundOverlayCalendarEvent(event)) {
			if (event.isDraft && isFullDayScheduleSelection(event)) {
				fullDayDraftEvents.push(event);
			} else {
				partialDraftEvents.push(event);
			}
			continue;
		}

		if (isBreakCalendarEvent(event)) {
			breakEvents.push(event);
			continue;
		}

		const resource = event.resource;
		if (!resource) continue;

		if (isReturnMeasureEntry(resource)) {
			if (isFullDayReturnMeasureEntry(resource)) {
				fullDayReturnMeasures.push(event);
			} else {
				gutterOverlays.push(event);
			}
		} else if (isAbsenceNoticeEntry(resource)) {
			gutterOverlays.push(event);
		} else {
			lessons.push(event);
		}
	}

	const pack = (items: CalendarEvent[]) =>
		noOverlap({
			events: items,
			minimumStartDifference,
			slotMetrics,
			accessors,
		}) as StyledEvent[];

	const styledLessons = pack(lessons);
	const styledGutterOverlays = pack(gutterOverlays)
		.map((styled) => {
			const hasOverlappingLesson = lessons.some((lesson) => eventsOverlap(styled.event, lesson));
			return {
				...styled,
				style: hasOverlappingLesson
					? scaleLayoutToGutter(styled.style, AGENDA_SIDE_GUTTER_PERCENT)
					: styled.style,
			};
		})
		.map((styled) => restoreTimedBounds(styled, slotMetrics, accessors));

	const shiftedLessons = (
		gutterOverlays.length === 0
			? styledLessons
			: styledLessons.map((styled) => {
					if (!gutterOverlays.some((overlay) => eventsOverlap(styled.event, overlay))) {
						return styled;
					}
					return {
						...styled,
						style: shiftLayoutForGutter(styled.style, AGENDA_SIDE_GUTTER_PERCENT),
					};
				})
	).map((styled) => restoreTimedBounds(styled, slotMetrics, accessors));

	const styledFullDayMeasures: StyledEvent[] = fullDayReturnMeasures.map((event) => ({
		event,
		style: timedStyleFromEvent(event, slotMetrics, accessors),
	}));

	const styledBreakEvents: StyledEvent[] = breakEvents.map((event) => ({
		event,
		style: timedStyleFromEvent(event, slotMetrics, accessors),
	}));

	const styledFullDayDraftEvents: StyledEvent[] = fullDayDraftEvents.map((event) => ({
		event,
		style: timedStyleFromEvent(event, slotMetrics, accessors),
	}));

	const styledPartialDraftEvents: StyledEvent[] = partialDraftEvents.map((event) => ({
		event,
		style: timedStyleFromEvent(event, slotMetrics, accessors),
	}));

	return snapTimedBoundaries([
		...styledFullDayMeasures,
		...styledFullDayDraftEvents,
		...styledBreakEvents,
		...styledGutterOverlays,
		...shiftedLessons,
		...styledPartialDraftEvents,
	]);
};
