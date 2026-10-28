import { useCallback, useEffect, useState } from 'react';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { nextSchoolDay } from '@/lib/return-measure/reschedule';
import { applyRescheduleSlotSelection } from '@/lib/return-measure/rescheduleSelections';
import { clampReturnMeasureDay } from '@/lib/return-measure/scheduleBounds';

/** Owns selection/focus session state for the not-reported reschedule planner. */
export function useReschedulePlannerSession(enabled: boolean, bounds: { start: Date; end: Date } | null) {
	const [selections, setSelections] = useState<AgendaSlotSelection[]>([]);
	const [userPicked, setUserPicked] = useState(false);
	const [focusDate, setFocusDate] = useState<Date | undefined>();

	useEffect(() => {
		if (!enabled || !bounds) {
			setSelections([]);
			setUserPicked(false);
			setFocusDate(undefined);
			return;
		}

		setSelections([]);
		setUserPicked(false);
		setFocusDate(clampReturnMeasureDay(nextSchoolDay(bounds.start)));
	}, [enabled, bounds]);

	const applySuggestion = useCallback((next: AgendaSlotSelection) => {
		setSelections([next]);
		setFocusDate(next.start);
	}, []);

	const advanceWeek = useCallback((nextFocus: Date) => {
		setFocusDate(nextFocus);
	}, []);

	const selectSlot = useCallback((next: AgendaSlotSelection, meta?: { additive?: boolean }) => {
		setUserPicked(true);
		setSelections((current) => applyRescheduleSlotSelection(current, next, meta));
		setFocusDate(next.start);
	}, []);

	return {
		selections,
		userPicked,
		focusDate,
		applySuggestion,
		advanceWeek,
		selectSlot,
	};
}
