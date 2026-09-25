import { useCallback, useEffect, useRef, useState } from 'react';
import type { SlotInfo } from 'react-big-calendar';
import type { AgendaSlotSelection } from '@/lib/agendaSlotSelection';
import { isAllDaySlotSelection, slotInfoToSelection } from '@/lib/agendaSlotSelection';
import { getFullDayScheduleSelection } from '@/lib/fullDayScheduleUtils';
import { snapSelectionToLessonHours } from '@/lib/lessonHours';

export function useAgendaCalendarSelection(onSelectSlot?: (selection: AgendaSlotSelection) => void) {
	const [selectingPreview, setSelectingPreview] = useState<AgendaSlotSelection | null>(null);
	const [hoveredLessonSlot, setHoveredLessonSlot] = useState<{ dateKey: string; lessonIndex: number } | null>(null);
	const isSelectingRef = useRef(false);
	const selectionCompletedRef = useRef(false);
	const clearHoverTimeoutRef = useRef<number | undefined>(undefined);

	const handleSelecting = useCallback((range: { start: Date; end: Date }): boolean | undefined => {
		isSelectingRef.current = true;
		selectionCompletedRef.current = false;
		setHoveredLessonSlot(null);
		setSelectingPreview(snapSelectionToLessonHours(range));
		return undefined;
	}, []);

	const handleSelectFullDay = useCallback(
		(day: Date) => {
			if (!onSelectSlot) return;
			setSelectingPreview(null);
			setHoveredLessonSlot(null);
			onSelectSlot(getFullDayScheduleSelection(day));
		},
		[onSelectSlot],
	);

	const handleSelectSlot = useCallback(
		(slotInfo: SlotInfo) => {
			if (!onSelectSlot) return;
			isSelectingRef.current = false;
			selectionCompletedRef.current = true;
			setSelectingPreview(null);
			setHoveredLessonSlot(null);

			const snapped = isAllDaySlotSelection(slotInfo)
				? getFullDayScheduleSelection(slotInfo.start)
				: snapSelectionToLessonHours(slotInfoToSelection(slotInfo));
			if (!snapped) return;
			onSelectSlot(snapped);
		},
		[onSelectSlot],
	);

	useEffect(() => {
		if (!onSelectSlot) return;

		const handlePointerUp = () => {
			if (!isSelectingRef.current) return;
			isSelectingRef.current = false;
			queueMicrotask(() => {
				if (!selectionCompletedRef.current) {
					setSelectingPreview(null);
				}
				selectionCompletedRef.current = false;
			});
		};

		window.addEventListener('pointerup', handlePointerUp);
		return () => window.removeEventListener('pointerup', handlePointerUp);
	}, [onSelectSlot]);

	return {
		selectingPreview,
		hoveredLessonSlot,
		setHoveredLessonSlot,
		clearHoverTimeoutRef,
		handleSelecting,
		handleSelectFullDay,
		handleSelectSlot,
	};
}
