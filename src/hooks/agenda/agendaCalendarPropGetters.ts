import { hoveredSlotFromSelection, resolveAgendaHoverSelection } from '@/hooks/agenda/resolveAgendaHoverSelection';
import type { TransformAgendaSelection } from '@/hooks/agenda/useAgendaCalendarSelection';
import type { CalendarEvent } from '@/lib/agenda/calendarUtils';
import { isSameCalendarDay } from '@/lib/agenda/calendarUtils';
import { isAbsenceNoticeEntry, isReturnMeasureEntry } from '@/lib/agenda/entryUtils';
import { isFullDayReturnMeasureEntry, isFullDayScheduleSelection } from '@/lib/agenda/fullDayScheduleUtils';
import { findAppointmentSlotForDateTime, type HoveredAgendaSlot } from '@/lib/agenda/lessonHours';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { getDateKey } from '@/lib/shared/dateUtils';
import { cn } from '@/lib/utils';

export function calendarDayPropGetter(d: Date, highlightDateKey?: string | null) {
	const dateKey = getDateKey(d);
	return {
		className: cn(
			isSameCalendarDay(d, new Date()) && 'agenda-today-column',
			highlightDateKey != null && dateKey === highlightDateKey && 'agenda-highlight-column',
		),
	};
}

export function calendarEventPropGetter(event: CalendarEvent) {
	if (event.isBreak) {
		return {
			className: 'agenda-break-band',
			style: { zIndex: 1, pointerEvents: 'none' as const },
		};
	}
	if (event.isHoverSlot) {
		const isFullDayHover = isFullDayScheduleSelection(event);
		return {
			className: cn('agenda-hover-slot', isFullDayHover && 'agenda-draft-full-day-event'),
			// Above draft so a preview on another day stays readable next to the selection.
			style: { zIndex: 4, pointerEvents: 'none' as const },
		};
	}
	if (event.isDraft) {
		const isFullDayDraft = isFullDayScheduleSelection(event);
		return {
			className: cn('agenda-draft-event', isFullDayDraft && 'agenda-draft-full-day-event'),
			style: { zIndex: isFullDayDraft ? 2 : 3, pointerEvents: 'none' as const },
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
	suppressHover: boolean,
	createMode: boolean,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	setHoveredSlot: (slot: HoveredAgendaSlot | null) => void,
	clearHoverTimeoutRef: { current: number | undefined },
	transformSelection?: TransformAgendaSelection,
) {
	return (slotDate: Date) => {
		if (!onSelectSlot || suppressHover) return {};

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
				const resolved = resolveAgendaHoverSelection(slot, transformSelection);
				if (!resolved) {
					setHoveredSlot(null);
					return;
				}
				setHoveredSlot(transformSelection ? hoveredSlotFromSelection(resolved) : slot);
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
