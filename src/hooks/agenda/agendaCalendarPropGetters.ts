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

const agendaSlotDateKeyAttr = 'data-agenda-date-key';
const agendaSlotStartTimeAttr = 'data-agenda-start-time';
const agendaSlotEndTimeAttr = 'data-agenda-end-time';

function agendaSlotDataAttrs(slot: HoveredAgendaSlot) {
	return {
		[agendaSlotDateKeyAttr]: slot.dateKey,
		[agendaSlotStartTimeAttr]: slot.startTime,
		[agendaSlotEndTimeAttr]: slot.endTime,
	};
}

/** Resolve the appointment slot under the pointer (works through lesson events). */
export function findHoveredAgendaSlotAtPoint(clientX: number, clientY: number): HoveredAgendaSlot | null {
	for (const element of document.elementsFromPoint(clientX, clientY)) {
		if (!(element instanceof HTMLElement)) continue;
		const dateKey = element.getAttribute(agendaSlotDateKeyAttr);
		const startTime = element.getAttribute(agendaSlotStartTimeAttr);
		const endTime = element.getAttribute(agendaSlotEndTimeAttr);
		if (dateKey && startTime && endTime) {
			return { dateKey, startTime, endTime };
		}
	}
	return null;
}

export function createCalendarSlotPropGetter(
	activePreview: AgendaSlotSelection | null,
	createMode: boolean,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	setHoveredSlot: (slot: HoveredAgendaSlot | null) => void,
	clearHoverTimeoutRef: { current: number | undefined },
) {
	return (slotDate: Date) => {
		if (!onSelectSlot || activePreview) return {};

		const appointmentSlot = findAppointmentSlotForDateTime(slotDate);
		if (!appointmentSlot) return {};

		const slot: HoveredAgendaSlot = {
			dateKey: getDateKey(slotDate),
			startTime: appointmentSlot.start,
			endTime: appointmentSlot.end,
		};
		const slotMeta = agendaSlotDataAttrs(slot);

		if (!createMode) return slotMeta;

		return {
			...slotMeta,
			className: 'agenda-creatable-slot',
			onMouseEnter: () => {
				window.clearTimeout(clearHoverTimeoutRef.current);
				setHoveredSlot(slot);
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
