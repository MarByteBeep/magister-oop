import { useCallback, useEffect, useState } from 'react';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { nextSchoolDay } from '@/lib/return-measure/reschedule';
import { clampReturnMeasureDay } from '@/lib/return-measure/scheduleBounds';

/** Owns selection/focus session state for the not-reported reschedule planner. */
export function useReschedulePlannerSession(enabled: boolean, bounds: { start: Date; end: Date } | null) {
	const [selection, setSelection] = useState<AgendaSlotSelection | null>(null);
	const [userPicked, setUserPicked] = useState(false);
	const [focusDate, setFocusDate] = useState<Date | undefined>();

	useEffect(() => {
		if (!enabled || !bounds) {
			setSelection(null);
			setUserPicked(false);
			setFocusDate(undefined);
			return;
		}

		setSelection(null);
		setUserPicked(false);
		setFocusDate(clampReturnMeasureDay(nextSchoolDay(bounds.start)));
	}, [enabled, bounds]);

	const applySuggestion = useCallback((next: AgendaSlotSelection) => {
		setSelection(next);
		setFocusDate(next.start);
	}, []);

	const advanceWeek = useCallback((nextFocus: Date) => {
		setFocusDate(nextFocus);
	}, []);

	const selectSlot = useCallback((next: AgendaSlotSelection) => {
		setUserPicked(true);
		setSelection(next);
		setFocusDate(next.start);
	}, []);

	return {
		selection,
		userPicked,
		focusDate,
		applySuggestion,
		advanceWeek,
		selectSlot,
	};
}
