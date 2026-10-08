import { useCallback, useMemo } from 'react';
import { useLoadAgendaForStudent } from '@/hooks/agenda/useLoadAgendaForStudent';
import { useWeeklyAgenda } from '@/hooks/agenda/useWeeklyAgenda';
import { useReschedulePlannerSession } from '@/hooks/return-measure/useReschedulePlannerSession';
import { useRescheduleSuggestion } from '@/hooks/return-measure/useRescheduleSuggestion';
import { useStudentById } from '@/hooks/students/useStudentById';
import { isAgendaDayLoaded } from '@/lib/agenda/loadUtils';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import {
	constrainRescheduleSelection,
	parseMeasureBounds,
	rescheduleReturnMeasureDescription,
	returnMeasureScheduleKind,
} from '@/lib/return-measure/reschedule';
import { buildReschedulePlan, rescheduleHighlightDateKey } from '@/lib/return-measure/reschedulePlan';
import { getDateKey, getNow } from '@/lib/shared/dateUtils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

export function useReturnMeasureReschedulePlanner(measure: ReturnMeasureStudent, enabled: boolean) {
	const studentId = measure.leerling.id;
	const student = useStudentById(studentId);
	const loadAgendaForStudent = useLoadAgendaForStudent();
	const bounds = useMemo(() => parseMeasureBounds(measure.begin, measure.einde), [measure.begin, measure.einde]);
	const kind = bounds ? returnMeasureScheduleKind(bounds.start, bounds.end) : null;
	const description = bounds ? rescheduleReturnMeasureDescription(bounds.start) : '';
	const session = useReschedulePlannerSession(enabled, bounds);
	const week = useWeeklyAgenda(studentId, student, loadAgendaForStudent, enabled ? session.focusDate : undefined);

	useRescheduleSuggestion({
		enabled,
		bounds,
		kind,
		userPicked: session.userPicked,
		hasSelection: session.selection != null,
		agenda: student?.agenda,
		weekDays: week.weekDays,
		selectedWeekDate: week.selectedWeekDate,
		isLoading: week.isLoading,
		onApply: session.applySuggestion,
		onAdvanceWeek: session.advanceWeek,
		sessionKey: `${enabled}:${measure.begin}:${measure.einde}`,
	});

	const plan = useMemo(() => buildReschedulePlan(session.selection, description), [session.selection, description]);

	const dayEntriesForDate = useCallback(
		(date: Date) => {
			const dateKey = getDateKey(date);
			if (!student?.agenda || !isAgendaDayLoaded(student.agenda, dateKey)) return null;
			return student.agenda[dateKey] ?? [];
		},
		[student?.agenda],
	);

	const transformSelection = useCallback(
		(picked: AgendaSlotSelection) => {
			if (!bounds || !kind) return picked;
			return constrainRescheduleSelection(
				kind,
				bounds.start,
				bounds.end,
				picked,
				getNow(),
				dayEntriesForDate(picked.start),
			);
		},
		[bounds, kind, dayEntriesForDate],
	);

	const selectionDayEntries = useMemo(
		() => (session.selection ? dayEntriesForDate(session.selection.start) : null),
		[session.selection, dayEntriesForDate],
	);

	return {
		studentId,
		bounds,
		kind,
		description,
		selection: session.selection,
		selectionDayEntries,
		plan,
		highlightDateKey: rescheduleHighlightDateKey(session.selection, bounds),
		handleSelectSlot: session.selectSlot,
		transformSelection,
		...week,
	};
}
