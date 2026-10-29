import { useCallback, useEffect, useRef, useState } from 'react';
import type { SlotInfo } from 'react-big-calendar';
import { findHoveredAgendaSlotAtPoint } from '@/hooks/agenda/agendaCalendarPropGetters';
import { getFullDayScheduleSelection } from '@/lib/agenda/fullDayScheduleUtils';
import { type HoveredAgendaSlot, snapSelectionToLessonHours } from '@/lib/agenda/lessonHours';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { isAllDaySlotSelection, slotInfoToSelection } from '@/lib/agenda/slotSelection';

function useAgendaSelectionState(createMode: boolean) {
	const [selectingPreview, setSelectingPreview] = useState<AgendaSlotSelection | null>(null);
	const [hoveredSlot, setHoveredSlot] = useState<HoveredAgendaSlot | null>(null);
	const isSelectingRef = useRef(false);
	const selectionCompletedRef = useRef(false);
	const clearHoverTimeoutRef = useRef<number | undefined>(undefined);
	const createModeRef = useRef(createMode);
	createModeRef.current = createMode;

	return {
		selectingPreview,
		setSelectingPreview,
		hoveredSlot,
		setHoveredSlot,
		isSelectingRef,
		selectionCompletedRef,
		clearHoverTimeoutRef,
		createModeRef,
	};
}

function snappedSelectionFromSlot(slotInfo: SlotInfo): AgendaSlotSelection | null {
	if (isAllDaySlotSelection(slotInfo)) return getFullDayScheduleSelection(slotInfo.start);
	return snapSelectionToLessonHours(slotInfoToSelection(slotInfo));
}

function canAcceptSelection(
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	createMode: boolean,
): onSelectSlot is (selection: AgendaSlotSelection) => void {
	return Boolean(onSelectSlot) && createMode;
}

function clearHoverState(state: ReturnType<typeof useAgendaSelectionState>) {
	window.clearTimeout(state.clearHoverTimeoutRef.current);
	state.setSelectingPreview(null);
	state.setHoveredSlot(null);
}

function applyPointerHover(
	pointerRef: React.RefObject<{ x: number; y: number } | null>,
	setHoveredSlot: (value: ReturnType<typeof useAgendaSelectionState>['hoveredSlot']) => void,
) {
	const point = pointerRef.current;
	if (!point) return;
	const slot = findHoveredAgendaSlotAtPoint(point.x, point.y);
	if (slot) setHoveredSlot(slot);
}

function useAgendaSelectionEffects(
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	createMode: boolean,
	state: ReturnType<typeof useAgendaSelectionState>,
) {
	const pointerRef = useRef<{ x: number; y: number } | null>(null);

	useEffect(() => {
		if (!onSelectSlot) return;
		const trackPointer = (event: PointerEvent) => {
			pointerRef.current = { x: event.clientX, y: event.clientY };
		};
		window.addEventListener('pointermove', trackPointer, { passive: true });
		return () => window.removeEventListener('pointermove', trackPointer);
	}, [onSelectSlot]);

	useEffect(() => {
		if (!createMode) {
			clearHoverState(state);
			return;
		}
		applyPointerHover(pointerRef, state.setHoveredSlot);
	}, [createMode, state]);

	useEffect(() => {
		if (!onSelectSlot) return;
		const handlePointerUp = () => {
			if (!state.isSelectingRef.current) return;
			state.isSelectingRef.current = false;
			queueMicrotask(() => {
				if (!state.selectionCompletedRef.current) state.setSelectingPreview(null);
				state.selectionCompletedRef.current = false;
			});
		};
		window.addEventListener('pointerup', handlePointerUp);
		return () => window.removeEventListener('pointerup', handlePointerUp);
	}, [onSelectSlot, state]);
}

export function useAgendaCalendarSelection(
	onSelectSlot?: (selection: AgendaSlotSelection) => void,
	createMode?: boolean,
) {
	const isCreateMode = createMode === true;
	const state = useAgendaSelectionState(isCreateMode);
	useAgendaSelectionEffects(onSelectSlot, isCreateMode, state);

	const handleSelecting = useCallback(
		(range: { start: Date; end: Date }): boolean | undefined => {
			if (!state.createModeRef.current) return false;
			state.isSelectingRef.current = true;
			state.selectionCompletedRef.current = false;
			state.setHoveredSlot(null);
			state.setSelectingPreview(snapSelectionToLessonHours(range));
			return undefined;
		},
		[state],
	);

	const handleSelectFullDay = useCallback(
		(day: Date) => {
			if (!canAcceptSelection(onSelectSlot, state.createModeRef.current)) return;
			state.setSelectingPreview(null);
			state.setHoveredSlot(null);
			onSelectSlot(getFullDayScheduleSelection(day));
		},
		[onSelectSlot, state],
	);

	const handleSelectSlot = useCallback(
		(slotInfo: SlotInfo) => {
			if (!canAcceptSelection(onSelectSlot, state.createModeRef.current)) return;
			state.isSelectingRef.current = false;
			state.selectionCompletedRef.current = true;
			state.setSelectingPreview(null);
			state.setHoveredSlot(null);
			const snapped = snappedSelectionFromSlot(slotInfo);
			if (!snapped) return;
			onSelectSlot(snapped);
		},
		[onSelectSlot, state],
	);

	return {
		selectingPreview: state.selectingPreview,
		hoveredSlot: state.hoveredSlot,
		setHoveredSlot: state.setHoveredSlot,
		clearHoverTimeoutRef: state.clearHoverTimeoutRef,
		handleSelecting,
		handleSelectFullDay,
		handleSelectSlot,
	};
}
