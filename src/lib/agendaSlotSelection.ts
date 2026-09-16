import { formatTime, getDateKey, parseDateKey } from '@/lib/dateUtils';

export type AgendaSlotSelection = {
	start: Date;
	end: Date;
};

export function slotInfoToSelection(slot: { start: Date; end: Date }): AgendaSlotSelection {
	return { start: slot.start, end: slot.end };
}

/** RBC week-view all-day header slots span midnight through the next calendar day. */
export function isAllDaySlotSelection(slot: { start: Date; end: Date }): boolean {
	const { start, end } = slot;
	if (start.getHours() !== 0 || start.getMinutes() !== 0 || start.getSeconds() !== 0) return false;
	if (end.getHours() !== 0 || end.getMinutes() !== 0 || end.getSeconds() !== 0) return false;

	const nextDay = new Date(start);
	nextDay.setDate(nextDay.getDate() + 1);
	return end.getTime() >= nextDay.getTime();
}

export function parseLocalDateAndTime(dateKey: string, time: string): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;

	const [hours, minutes] = time.split(':').map(Number);
	if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

	const date = parseDateKey(dateKey);
	date.setHours(hours, minutes, 0, 0);
	return date;
}

export function buildAgendaSlotSelection(
	dateKey: string,
	startTime: string,
	endTime: string,
): AgendaSlotSelection | null {
	const start = parseLocalDateAndTime(dateKey, startTime);
	const end = parseLocalDateAndTime(dateKey, endTime);
	if (!start || !end || end <= start) return null;
	return { start, end };
}

export function selectionToFormValues(selection: AgendaSlotSelection): {
	dateKey: string;
	startTime: string;
	endTime: string;
} {
	return {
		dateKey: getDateKey(selection.start),
		startTime: formatTime(selection.start),
		endTime: formatTime(selection.end),
	};
}
