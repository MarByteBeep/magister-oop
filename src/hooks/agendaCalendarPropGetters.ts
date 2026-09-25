import type { CalendarEvent } from '@/lib/agendaCalendarUtils';
import { isSameCalendarDay } from '@/lib/agendaCalendarUtils';
import { isAbsenceNoticeEntry, isReturnMeasureEntry } from '@/lib/agendaEntryUtils';
import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { getDateKey } from '@/lib/dateUtils';
import { isFullDayReturnMeasureEntry, isFullDayScheduleSelection } from '@/lib/fullDayScheduleUtils';
import { findLessonIndexForDateTime } from '@/lib/lessonHours';
import { cn } from '@/lib/utils';

export function calendarDayPropGetter(d: Date) {
	return { className: cn(isSameCalendarDay(d, new Date()) && 'agenda-today-column') };
}

export function calendarEventPropGetter(event: CalendarEvent) {
	if (event.isBreak) {
		return {
			className: 'agenda-break-band',
			style: { zIndex: 1, pointerEvents: 'none' as const },
		};
	}
	if (event.isHoverSlot) {
		return {
			className: 'agenda-hover-slot',
			style: { zIndex: 2, pointerEvents: 'none' as const },
		};
	}
	if (event.isDraft) {
		const isFullDayDraft = isFullDayScheduleSelection(event);
		return {
			className: cn('agenda-draft-event', isFullDayDraft && 'agenda-draft-full-day-event'),
			style: { zIndex: isFullDayDraft ? 1 : 3, pointerEvents: 'none' as const },
		};
	}

	const resource = event.resource;
	if (!resource) {
		return { className: 'agenda-lesson-event', style: { zIndex: 2 } };
	}
	if (isReturnMeasureEntry(resource)) {
		if (isFullDayReturnMeasureEntry(resource)) {
			return { className: 'agenda-return-measure-event', style: { zIndex: 1 } };
		}
		return { className: 'agenda-return-measure-gutter-event', style: { zIndex: 2 } };
	}
	if (isAbsenceNoticeEntry(resource)) {
		return { className: 'agenda-absence-notice-event', style: { zIndex: 2 } };
	}
	return { className: 'agenda-lesson-event', style: { zIndex: 2 } };
}

export function createCalendarSlotPropGetter(
	occupiedLessonHours: Set<string>,
	activePreview: AgendaSlotSelection | null,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	setHoveredLessonSlot: (slot: { dateKey: string; lessonIndex: number } | null) => void,
	clearHoverTimeoutRef: { current: number | undefined },
) {
	return (slotDate: Date) => {
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
	};
}

export function calendarTooltipAccessor() {
	return '';
}
