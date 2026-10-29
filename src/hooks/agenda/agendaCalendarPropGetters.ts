import type { CalendarEvent } from '@/lib/agenda/calendarUtils';
import { isSameCalendarDay } from '@/lib/agenda/calendarUtils';
import { isAbsenceNoticeEntry, isReturnMeasureEntry } from '@/lib/agenda/entryUtils';
import { isFullDayReturnMeasureEntry, isFullDayScheduleSelection } from '@/lib/agenda/fullDayScheduleUtils';
import { findAppointmentSlotForDateTime, type HoveredAgendaSlot } from '@/lib/agenda/lessonHours';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { getDateKey } from '@/lib/shared/dateUtils';
import { cn } from '@/lib/utils';
import type { ReturnMeasureAgendaEntry } from '@/magister/response/agendaEntry.types';

export type EventPropResult = {
	className: string;
	style?: { zIndex: number; pointerEvents?: 'none' };
};

export function calendarDayPropGetter(d: Date) {
	return {
		className: cn(isSameCalendarDay(d, new Date()) && 'agenda-today-column'),
	};
}

function overlayEventProps(className: string, zIndex: number): EventPropResult {
	return {
		className,
		style: { zIndex, pointerEvents: 'none' as const },
	};
}

function draftEventProps(event: CalendarEvent): EventPropResult {
	if (isFullDayScheduleSelection(event)) {
		return {
			className: cn('agenda-draft-event', 'agenda-draft-full-day-event'),
			style: { zIndex: 1, pointerEvents: 'none' as const },
		};
	}
	return {
		className: 'agenda-draft-event',
		style: { zIndex: 3, pointerEvents: 'none' as const },
	};
}

function breakOrHoverProps(event: CalendarEvent): EventPropResult | null {
	if (event.isBreak) return overlayEventProps('agenda-break-band', 1);
	if (event.isHoverSlot) return overlayEventProps('agenda-hover-slot', 2);
	return null;
}

function specialOverlayProps(event: CalendarEvent): EventPropResult | null {
	const early = breakOrHoverProps(event);
	if (early) return early;
	if (event.isDraft) return draftEventProps(event);
	return null;
}

function returnMeasureEventProps(resource: ReturnMeasureAgendaEntry): EventPropResult {
	if (isFullDayReturnMeasureEntry(resource)) {
		return { className: 'agenda-return-measure-event', style: { zIndex: 1 } };
	}
	return {
		className: 'agenda-return-measure-gutter-event',
		style: { zIndex: 2 },
	};
}

function resourceEventProps(resource: NonNullable<CalendarEvent['resource']>): EventPropResult {
	if (isReturnMeasureEntry(resource)) return returnMeasureEventProps(resource);
	if (isAbsenceNoticeEntry(resource)) {
		return { className: 'agenda-absence-notice-event', style: { zIndex: 2 } };
	}
	return { className: 'agenda-lesson-event', style: { zIndex: 2 } };
}

export function calendarEventPropGetter(event: CalendarEvent): EventPropResult {
	const overlay = specialOverlayProps(event);
	if (overlay) return overlay;
	if (!event.resource) return { className: 'agenda-lesson-event', style: { zIndex: 2 } };
	return resourceEventProps(event.resource);
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

function isPresent(value: string | null): value is string {
	return Boolean(value);
}

function timesFromAttrs(
	startTime: string | null,
	endTime: string | null,
): { startTime: string; endTime: string } | null {
	if (!isPresent(startTime)) return null;
	if (!isPresent(endTime)) return null;
	return { startTime, endTime };
}

function slotFromAttrs(
	dateKey: string | null,
	startTime: string | null,
	endTime: string | null,
): HoveredAgendaSlot | null {
	if (!isPresent(dateKey)) return null;
	const times = timesFromAttrs(startTime, endTime);
	if (!times) return null;
	return { dateKey, ...times };
}

function hoveredSlotFromElement(element: Element): HoveredAgendaSlot | null {
	if (!(element instanceof HTMLElement)) return null;
	return slotFromAttrs(
		element.getAttribute(agendaSlotDateKeyAttr),
		element.getAttribute(agendaSlotStartTimeAttr),
		element.getAttribute(agendaSlotEndTimeAttr),
	);
}

/** Resolve the appointment slot under the pointer (works through lesson events). */
export function findHoveredAgendaSlotAtPoint(clientX: number, clientY: number): HoveredAgendaSlot | null {
	for (const element of document.elementsFromPoint(clientX, clientY)) {
		const slot = hoveredSlotFromElement(element);
		if (slot) return slot;
	}
	return null;
}

function creatableSlotHandlers(
	slot: HoveredAgendaSlot,
	setHoveredSlot: (slot: HoveredAgendaSlot | null) => void,
	clearHoverTimeoutRef: { current: number | undefined },
) {
	return {
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
}

function canAttachSlotMeta(
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	activePreview: AgendaSlotSelection | null,
): boolean {
	if (!onSelectSlot) return false;
	return !activePreview;
}

function buildSlotPropResult(
	slotDate: Date,
	appointmentSlot: { start: string; end: string },
	createMode: boolean,
	setHoveredSlot: (slot: HoveredAgendaSlot | null) => void,
	clearHoverTimeoutRef: { current: number | undefined },
) {
	const slot: HoveredAgendaSlot = {
		dateKey: getDateKey(slotDate),
		startTime: appointmentSlot.start,
		endTime: appointmentSlot.end,
	};
	const slotMeta = agendaSlotDataAttrs(slot);
	if (!createMode) return slotMeta;
	return { ...slotMeta, ...creatableSlotHandlers(slot, setHoveredSlot, clearHoverTimeoutRef) };
}

export function createCalendarSlotPropGetter(
	activePreview: AgendaSlotSelection | null,
	createMode: boolean,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	setHoveredSlot: (slot: HoveredAgendaSlot | null) => void,
	clearHoverTimeoutRef: { current: number | undefined },
) {
	return (slotDate: Date) => {
		if (!canAttachSlotMeta(onSelectSlot, activePreview)) return {};
		const appointmentSlot = findAppointmentSlotForDateTime(slotDate);
		if (!appointmentSlot) return {};
		return buildSlotPropResult(slotDate, appointmentSlot, createMode, setHoveredSlot, clearHoverTimeoutRef);
	};
}

export function calendarTooltipAccessor() {
	return '';
}
