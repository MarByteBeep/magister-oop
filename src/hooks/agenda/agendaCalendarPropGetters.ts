import type { CalendarEvent } from '@/lib/agenda/calendarUtils';
import { isSameCalendarDay } from '@/lib/agenda/calendarUtils';
import { isAbsenceNoticeEntry, isReturnMeasureEntry } from '@/lib/agenda/entryUtils';
import { isFullDayReturnMeasureEntry, isFullDayScheduleSelection } from '@/lib/agenda/fullDayScheduleUtils';
import { findAppointmentSlotForDateTime, type HoveredAgendaSlot } from '@/lib/agenda/lessonHours';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { getDateKey } from '@/lib/shared/dateUtils';
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
	activePreview: AgendaSlotSelection | null,
	createMode: boolean,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	setHoveredSlot: (slot: HoveredAgendaSlot | null) => void,
	clearHoverTimeoutRef: { current: number | undefined },
) {
	return (slotDate: Date) => {
		if (!createMode || !onSelectSlot || activePreview) return {};

		const appointmentSlot = findAppointmentSlotForDateTime(slotDate);
		if (!appointmentSlot) return {};

		const dateKey = getDateKey(slotDate);

		return {
			className: 'agenda-creatable-slot',
			onMouseEnter: () => {
				window.clearTimeout(clearHoverTimeoutRef.current);
				setHoveredSlot({ dateKey, startTime: appointmentSlot.start, endTime: appointmentSlot.end });
			},
			onMouseLeave: () => {
				window.clearTimeout(clearHoverTimeoutRef.current);
				clearHoverTimeoutRef.current = window.setTimeout(() => {
					setHoveredSlot(null);
				}, 40);
			},
		};
	};
}

export function calendarTooltipAccessor() {
	return '';
}
