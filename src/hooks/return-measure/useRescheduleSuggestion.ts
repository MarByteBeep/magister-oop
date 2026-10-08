import { useEffect, useRef } from 'react';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { type ReturnMeasureScheduleKind, resolveReschedulePlannerStep } from '@/lib/return-measure/reschedule';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

const MAX_AUTO_WEEK_ADVANCES = 4;

export function useRescheduleSuggestion(input: {
	enabled: boolean;
	bounds: { start: Date; end: Date } | null;
	kind: ReturnMeasureScheduleKind | null;
	userPicked: boolean;
	hasSelection: boolean;
	agenda: Record<string, AgendaEntry[]> | undefined;
	weekDays: Date[];
	selectedWeekDate: Date;
	isLoading: boolean;
	onApply: (selection: AgendaSlotSelection) => void;
	onAdvanceWeek: (nextFocus: Date) => void;
	/** Bumped when the planner should drop prior auto-suggest state. */
	sessionKey: string;
}) {
	const autoWeekAdvancesRef = useRef(0);
	const suggestedKeyRef = useRef<string | null>(null);
	const sessionKeyRef = useRef(input.sessionKey);

	if (sessionKeyRef.current !== input.sessionKey) {
		sessionKeyRef.current = input.sessionKey;
		autoWeekAdvancesRef.current = 0;
		suggestedKeyRef.current = null;
	}

	const {
		enabled,
		bounds,
		kind,
		userPicked,
		hasSelection,
		agenda,
		weekDays,
		selectedWeekDate,
		isLoading,
		onApply,
		onAdvanceWeek,
	} = input;

	useEffect(() => {
		if (!enabled || !bounds || !kind || userPicked) return;

		const step = resolveReschedulePlannerStep({
			originalStart: bounds.start,
			originalEnd: bounds.end,
			kind,
			agenda,
			weekDays,
			selectedWeekDate,
			isLoading,
			appliedKey: suggestedKeyRef.current,
			hasSelection,
			autoWeekAdvances: autoWeekAdvancesRef.current,
			maxAutoWeekAdvances: MAX_AUTO_WEEK_ADVANCES,
		});

		if (step.type === 'apply') {
			suggestedKeyRef.current = step.key;
			onApply(step.selection);
			return;
		}

		if (step.type === 'advance-week') {
			autoWeekAdvancesRef.current += 1;
			onAdvanceWeek(step.nextFocus);
		}
	}, [
		enabled,
		bounds,
		kind,
		userPicked,
		hasSelection,
		agenda,
		isLoading,
		selectedWeekDate,
		weekDays,
		onApply,
		onAdvanceWeek,
	]);
}
