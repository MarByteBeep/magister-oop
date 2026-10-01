import { useCallback, useEffect, useRef, useState } from 'react';
import type { SlotInfo } from 'react-big-calendar';
import { getFullDayScheduleSelection } from '@/lib/agenda/fullDayScheduleUtils';
import { type HoveredAgendaSlot, snapSelectionToLessonHours } from '@/lib/agenda/lessonHours';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { isAllDaySlotSelection, slotInfoToSelection } from '@/lib/agenda/slotSelection';

export function useAgendaCalendarSelection(
	onSelectSlot?: (selection: AgendaSlotSelection) => void,
	createMode = false,
) {
	const [selectingPreview, setSelectingPreview] = useState<AgendaSlotSelection | null>(null);
	const [hoveredSlot, setHoveredSlot] = useState<HoveredAgendaSlot | null>(null);
	const isSelectingRef = useRef(false);
	const selectionCompletedRef = useRef(false);
	const clearHoverTimeoutRef = useRef<number | undefined>(undefined);
	const createModeRef = useRef(createMode);
	createModeRef.current = createMode;

	const handleSelecting = useCallback((range: { start: Date; end: Date }): boolean | undefined => {
		if (!createModeRef.current) return false;
		isSelectingRef.current = true;
		selectionCompletedRef.current = false;
		setHoveredSlot(null);
		setSelectingPreview(snapSelectionToLessonHours(range));
		return undefined;
	}, []);

	const handleSelectFullDay = useCallback(
		(day: Date) => {
			if (!onSelectSlot || !createModeRef.current) return;
			setSelectingPreview(null);
			setHoveredSlot(null);
			onSelectSlot(getFullDayScheduleSelection(day));
		},
		[onSelectSlot],
	);

	const handleSelectSlot = useCallback(
		(slotInfo: SlotInfo) => {
			if (!onSelectSlot || !createModeRef.current) return;
			isSelectingRef.current = false;
			selectionCompletedRef.current = true;
			setSelectingPreview(null);
			setHoveredSlot(null);

			const snapped = isAllDaySlotSelection(slotInfo)
				? getFullDayScheduleSelection(slotInfo.start)
				: snapSelectionToLessonHours(slotInfoToSelection(slotInfo));
			if (!snapped) return;
			onSelectSlot(snapped);
		},
		[onSelectSlot],
	);

	useEffect(() => {
		if (createMode) return;
		window.clearTimeout(clearHoverTimeoutRef.current);
		setSelectingPreview(null);
		setHoveredSlot(null);
	}, [createMode]);

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
		hoveredSlot,
		setHoveredSlot,
		clearHoverTimeoutRef,
		handleSelecting,
		handleSelectFullDay,
		handleSelectSlot,
	};
}
