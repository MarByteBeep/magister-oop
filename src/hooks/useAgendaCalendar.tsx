import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EventProps, SlotInfo, View } from 'react-big-calendar';
import AgendaCalendarEvent from '@/components/student/AgendaCalendarEvent';
import AgendaCalendarHeader from '@/components/student/AgendaCalendarHeader';
import { firstLessonTime, lastLessonTime } from '@/components/student/agendaCalendarConfig';
import {
	agendaEntriesToCalendarEvents,
	type CalendarEvent,
	draftSelectionToBackgroundEvent,
	getOverlappingEventIds,
	hoverLessonSlotToBackgroundEvent,
	isSameCalendarDay,
} from '@/lib/agendaCalendarUtils';
import { agendaDayLayoutAlgorithm } from '@/lib/agendaDayLayout';
import { isAbsenceNoticeEntry, isLessonEntry, isReturnMeasureEntry } from '@/lib/agendaEntryUtils';
import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { slotInfoToSelection } from '@/lib/agendaSlotSelection';
import { hhmmToDate } from '@/lib/bigCalendarUtils';
import { getDateKey, parseDateKey } from '@/lib/dateUtils';
import { isFullDayReturnMeasureEntry } from '@/lib/fullDayScheduleUtils';
import {
	findLessonIndexForDateTime,
	findOverlappingLessonIndexRangeByDate,
	formatLessonHoursCompact,
	getLessonHourDateRange,
	getOverlappingLessonHoursForSelection,
	snapSelectionToLessonHours,
} from '@/lib/lessonHours';
import { cn } from '@/lib/utils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';

export function useAgendaCalendar(
	entries: AgendaEntry[],
	date: Date,
	view: View,
	activeEntry: AgendaEntry | null | undefined,
	onSelectEntry: (entry: AgendaEntry) => void,
	options?: {
		draftSelection?: AgendaSlotSelection | null;
		onSelectSlot?: (selection: AgendaSlotSelection) => void;
	},
) {
	const { draftSelection, onSelectSlot } = options ?? {};
	const [selectingPreview, setSelectingPreview] = useState<AgendaSlotSelection | null>(null);
	const [hoveredLessonSlot, setHoveredLessonSlot] = useState<{ dateKey: string; lessonIndex: number } | null>(null);
	const isSelectingRef = useRef(false);
	const selectionCompletedRef = useRef(false);
	const clearHoverTimeoutRef = useRef<number | undefined>(undefined);
	const events = useMemo(() => agendaEntriesToCalendarEvents(entries), [entries]);
	const activePreview = draftSelection ?? selectingPreview;
	const occupiedLessonHours = useMemo(() => {
		const occupied = new Set<string>();

		for (const entry of entries) {
			if (!isLessonEntry(entry)) continue;

			const entryStart = new Date(entry.start);
			const range = findOverlappingLessonIndexRangeByDate(entryStart, new Date(entry.end));
			if (!range) continue;

			const dateKey = getDateKey(entryStart);
			for (let index = range.from; index <= range.to; index++) {
				occupied.add(`${dateKey}:${index}`);
			}
		}

		return occupied;
	}, [entries]);
	const backgroundEvents = useMemo(() => {
		if (activePreview) {
			const lessonHours = getOverlappingLessonHoursForSelection(activePreview);
			const lessonLabel = formatLessonHoursCompact(lessonHours);
			return [
				draftSelectionToBackgroundEvent(activePreview, {
					title: lessonLabel ?? 'Nieuwe afspraak',
				}),
			];
		}

		if (!hoveredLessonSlot || !onSelectSlot) return [];

		const date = parseDateKey(hoveredLessonSlot.dateKey);
		return [hoverLessonSlotToBackgroundEvent(getLessonHourDateRange(date, hoveredLessonSlot.lessonIndex))];
	}, [activePreview, hoveredLessonSlot, onSelectSlot]);
	const overlappingEventIds = useMemo(() => getOverlappingEventIds(events), [events]);
	const min = useMemo(() => hhmmToDate(date, firstLessonTime), [date]);
	const max = useMemo(() => hhmmToDate(date, lastLessonTime), [date]);

	const handleSelectEvent = useCallback(
		(ev: CalendarEvent) => {
			if (ev.isDraft || ev.isHoverSlot || !ev.resource) return;
			onSelectEntry(ev.resource);
		},
		[onSelectEntry],
	);
	const handleSelecting = useCallback((range: { start: Date; end: Date }): boolean | undefined => {
		isSelectingRef.current = true;
		selectionCompletedRef.current = false;
		setHoveredLessonSlot(null);
		setSelectingPreview(snapSelectionToLessonHours(range));
		return undefined;
	}, []);

	const handleSelectSlot = useCallback(
		(slotInfo: SlotInfo) => {
			if (!onSelectSlot) return;
			isSelectingRef.current = false;
			selectionCompletedRef.current = true;
			setSelectingPreview(null);
			setHoveredLessonSlot(null);
			const snapped = snapSelectionToLessonHours(slotInfoToSelection(slotInfo));
			if (!snapped) return;
			onSelectSlot(snapped);
		},
		[onSelectSlot],
	);

	useEffect(() => {
		if (!onSelectSlot) return;

		const handlePointerUp = () => {
			if (!isSelectingRef.current) return;
			isSelectingRef.current = false;
			queueMicrotask(() => {
				if (!selectionCompletedRef.current) {
					setSelectingPreview(null);
				}
				selectionCompletedRef.current = false;
			});
		};

		window.addEventListener('pointerup', handlePointerUp);
		return () => window.removeEventListener('pointerup', handlePointerUp);
	}, [onSelectSlot]);
	const dayPropGetter = useCallback(
		(d: Date) => ({ className: cn(isSameCalendarDay(d, new Date()) && 'agenda-today-column') }),
		[],
	);
	const slotPropGetter = useCallback(
		(slotDate: Date) => {
			if (!onSelectSlot || activePreview) return {};

			const lessonIndex = findLessonIndexForDateTime(slotDate);
			if (lessonIndex < 0) return {};

			const dateKey = getDateKey(slotDate);
			const slotKey = `${dateKey}:${lessonIndex}`;
			if (occupiedLessonHours.has(slotKey)) return {};

			return {
				className: 'agenda-creatable-slot',
				onMouseEnter: () => {
					window.clearTimeout(clearHoverTimeoutRef.current);
					setHoveredLessonSlot({ dateKey, lessonIndex });
				},
				onMouseLeave: () => {
					window.clearTimeout(clearHoverTimeoutRef.current);
					clearHoverTimeoutRef.current = window.setTimeout(() => {
						setHoveredLessonSlot(null);
					}, 40);
				},
			};
		},
		[activePreview, occupiedLessonHours, onSelectSlot],
	);
	const tooltipAccessor = useCallback(() => '', []);
	const eventPropGetter = useCallback((event: CalendarEvent) => {
		if (event.isHoverSlot) {
			return {
				className: 'agenda-hover-slot',
				style: { zIndex: 2, pointerEvents: 'none' as const },
			};
		}
		if (event.isDraft) {
			return {
				className: 'agenda-draft-event',
				style: { zIndex: 3 },
			};
		}
		const resource = event.resource;
		if (!resource) {
			return { className: 'agenda-lesson-event', style: { zIndex: 2 } };
		}
		if (isReturnMeasureEntry(resource)) {
			if (isFullDayReturnMeasureEntry(resource)) {
				return {
					className: 'agenda-return-measure-event',
					style: { zIndex: 1 },
				};
			}
			return {
				className: 'agenda-return-measure-gutter-event',
				style: { zIndex: 2 },
			};
		}
		if (isAbsenceNoticeEntry(resource)) {
			return {
				className: 'agenda-absence-notice-event',
				style: { zIndex: 2 },
			};
		}
		return {
			className: 'agenda-lesson-event',
			style: { zIndex: 2 },
		};
	}, []);

	const components = useMemo(
		() => ({
			header: AgendaCalendarHeader,
			event: (props: EventProps<CalendarEvent>) =>
				createElement(AgendaCalendarEvent, { ...props, activeEntry, overlappingEventIds }),
		}),
		[activeEntry, overlappingEventIds],
	);

	const views: View[] = view === 'work_week' ? ['work_week'] : ['day'];

	return {
		events,
		backgroundEvents,
		min,
		max,
		handleSelectEvent,
		handleSelecting,
		handleSelectSlot,
		slotSelectionEnabled: onSelectSlot !== undefined,
		dayPropGetter,
		slotPropGetter,
		eventPropGetter,
		tooltipAccessor,
		components,
		views,
		dayLayoutAlgorithm: agendaDayLayoutAlgorithm,
	};
}
