import type { CSSProperties } from 'react';
import type { DayLayoutFunction } from 'react-big-calendar';
// RBC ships layout helpers as CJS; used to pack lessons without return measures.
import noOverlap from 'react-big-calendar/lib/utils/layout-algorithms/no-overlap.js';
import type { CalendarEvent } from '@/lib/agendaCalendarUtils';
import { isReturnMeasureAgendaItem } from '@/lib/returnMeasureUtils';

type LayoutStyle = CSSProperties & {
	top: number;
	height: number;
	width: number | string;
	xOffset: number | string;
};

type StyledEvent = {
	event: CalendarEvent;
	style: LayoutStyle;
};

/**
 * Pack lessons with no-overlap, but keep return measures full-width behind them
 * so a day-long measure never steals a column from the normal rooster.
 */
export const agendaDayLayoutAlgorithm: DayLayoutFunction<CalendarEvent> = ({
	events,
	minimumStartDifference,
	slotMetrics,
	accessors,
}) => {
	const lessons: CalendarEvent[] = [];
	const returnMeasures: CalendarEvent[] = [];

	for (const event of events) {
		if (isReturnMeasureAgendaItem(event.resource)) returnMeasures.push(event);
		else lessons.push(event);
	}

	const styledLessons = noOverlap({
		events: lessons,
		minimumStartDifference,
		slotMetrics,
		accessors,
	}) as StyledEvent[];

	const styledMeasures: StyledEvent[] = returnMeasures.map((event) => {
		const range = slotMetrics.getRange(accessors.start(event), accessors.end(event));
		return {
			event,
			style: {
				top: range.top,
				height: range.height,
				width: '100%',
				xOffset: 0,
			},
		};
	});

	return [...styledMeasures, ...styledLessons];
};
