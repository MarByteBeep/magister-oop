import type { CSSProperties } from 'react';
import type { DayLayoutFunction } from 'react-big-calendar';
// RBC ships layout helpers as CJS; used to pack lessons without overlay items.
import noOverlap from 'react-big-calendar/lib/utils/layout-algorithms/no-overlap.js';
import { type CalendarEvent, isSameCalendarDay } from '@/lib/agendaCalendarUtils';
import { isAbsenceNoticeEntry, isReturnMeasureEntry } from '@/lib/agendaEntryUtils';
import { isFullDayReturnMeasureEntry } from '@/lib/fullDayScheduleUtils';

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

	for (const event of events) {
		if (isReturnMeasureEntry(event.resource)) {
			if (isFullDayReturnMeasureEntry(event.resource)) {
				fullDayReturnMeasures.push(event);
			} else {
				gutterOverlays.push(event);
			}
		} else if (isAbsenceNoticeEntry(event.resource)) {
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
	const styledGutterOverlays = pack(gutterOverlays).map((styled) => {
		const hasOverlappingLesson = lessons.some((lesson) => eventsOverlap(styled.event, lesson));
		return {
			...styled,
			style: hasOverlappingLesson ? scaleLayoutToGutter(styled.style, AGENDA_SIDE_GUTTER_PERCENT) : styled.style,
		};
	});

	const shiftedLessons =
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
				});

	const styledFullDayMeasures: StyledEvent[] = fullDayReturnMeasures.map((event) => {
		const range = slotMetrics.getRange(accessors.start(event), accessors.end(event));
		return {
			event,
			style: {
				top: range.top,
				height: range.height,
				width: 100,
				xOffset: 0,
			},
		};
	});

	return [...styledFullDayMeasures, ...styledGutterOverlays, ...shiftedLessons];
};
