import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import type { SlotInfo } from 'react-big-calendar';
import { findHoveredAgendaSlotAtPoint } from '@/hooks/agenda/agendaCalendarPropGetters';
import { getFullDayScheduleSelection } from '@/lib/agenda/fullDayScheduleUtils';
import { type HoveredAgendaSlot, snapSelectionToLessonHours } from '@/lib/agenda/lessonHours';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { isAllDaySlotSelection, slotInfoToSelection } from '@/lib/agenda/slotSelection';

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

function clearHoverState(
	clearHoverTimeoutRef: RefObject<number | undefined>,
	setSelectingPreview: (value: AgendaSlotSelection | null) => void,
	setHoveredSlot: (value: HoveredAgendaSlot | null) => void,
) {
	window.clearTimeout(clearHoverTimeoutRef.current);
	setSelectingPreview(null);
	setHoveredSlot(null);
}

function applyPointerHover(
	pointerRef: RefObject<{ x: number; y: number } | null>,
	setHoveredSlot: (value: HoveredAgendaSlot | null) => void,
) {
	const point = pointerRef.current;
	if (!point) return;
	const slot = findHoveredAgendaSlotAtPoint(point.x, point.y);
	if (slot) setHoveredSlot(slot);
}

function usePointerTracking(onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined) {
	const pointerRef = useRef<{ x: number; y: number } | null>(null);

	useEffect(() => {
		if (!onSelectSlot) return;
		const trackPointer = (event: PointerEvent) => {
			pointerRef.current = { x: event.clientX, y: event.clientY };
		};
		window.addEventListener('pointermove', trackPointer, { passive: true });
		return () => window.removeEventListener('pointermove', trackPointer);
	}, [onSelectSlot]);

	return pointerRef;
}

function useCreateModeHover(
	createMode: boolean,
	pointerRef: RefObject<{ x: number; y: number } | null>,
	clearHoverTimeoutRef: RefObject<number | undefined>,
	setSelectingPreview: (value: AgendaSlotSelection | null) => void,
	setHoveredSlot: (value: HoveredAgendaSlot | null) => void,
) {
	useEffect(() => {
		if (!createMode) {
			clearHoverState(clearHoverTimeoutRef, setSelectingPreview, setHoveredSlot);
			return;
		}
		applyPointerHover(pointerRef, setHoveredSlot);
	}, [createMode, pointerRef, clearHoverTimeoutRef, setSelectingPreview, setHoveredSlot]);
}

function useSelectionPointerUp(
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	isSelectingRef: RefObject<boolean>,
	selectionCompletedRef: RefObject<boolean>,
	setSelectingPreview: (value: AgendaSlotSelection | null) => void,
) {
	useEffect(() => {
		if (!onSelectSlot) return;
		const handlePointerUp = () => {
			if (!isSelectingRef.current) return;
			isSelectingRef.current = false;
			queueMicrotask(() => {
				if (!selectionCompletedRef.current) setSelectingPreview(null);
				selectionCompletedRef.current = false;
			});
		};
		window.addEventListener('pointerup', handlePointerUp);
		return () => window.removeEventListener('pointerup', handlePointerUp);
	}, [onSelectSlot, isSelectingRef, selectionCompletedRef, setSelectingPreview]);
}

function useAgendaSelectionEffects(
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	createMode: boolean,
	setSelectingPreview: (value: AgendaSlotSelection | null) => void,
	setHoveredSlot: (value: HoveredAgendaSlot | null) => void,
	isSelectingRef: RefObject<boolean>,
	selectionCompletedRef: RefObject<boolean>,
	clearHoverTimeoutRef: RefObject<number | undefined>,
) {
	const pointerRef = usePointerTracking(onSelectSlot);
	useCreateModeHover(createMode, pointerRef, clearHoverTimeoutRef, setSelectingPreview, setHoveredSlot);
	useSelectionPointerUp(onSelectSlot, isSelectingRef, selectionCompletedRef, setSelectingPreview);
}

function useAgendaSelectionHandlers(
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
	setSelectingPreview: (value: AgendaSlotSelection | null) => void,
	setHoveredSlot: (value: HoveredAgendaSlot | null) => void,
	isSelectingRef: RefObject<boolean>,
	selectionCompletedRef: RefObject<boolean>,
	createModeRef: RefObject<boolean>,
) {
	const handleSelecting = useCallback(
		(range: { start: Date; end: Date }): boolean | undefined => {
			if (!createModeRef.current) return false;
			isSelectingRef.current = true;
			selectionCompletedRef.current = false;
			setHoveredSlot(null);
			setSelectingPreview(snapSelectionToLessonHours(range));
			return undefined;
		},
		[createModeRef, isSelectingRef, selectionCompletedRef, setHoveredSlot, setSelectingPreview],
	);

	const handleSelectFullDay = useCallback(
		(day: Date) => {
			if (!canAcceptSelection(onSelectSlot, createModeRef.current)) return;
			setSelectingPreview(null);
			setHoveredSlot(null);
			onSelectSlot(getFullDayScheduleSelection(day));
		},
		[onSelectSlot, createModeRef, setSelectingPreview, setHoveredSlot],
	);

	const handleSelectSlot = useCallback(
		(slotInfo: SlotInfo) => {
			if (!canAcceptSelection(onSelectSlot, createModeRef.current)) return;
			isSelectingRef.current = false;
			selectionCompletedRef.current = true;
			setSelectingPreview(null);
			setHoveredSlot(null);
			const snapped = snappedSelectionFromSlot(slotInfo);
			if (!snapped) return;
			onSelectSlot(snapped);
		},
		[onSelectSlot, createModeRef, isSelectingRef, selectionCompletedRef, setSelectingPreview, setHoveredSlot],
	);

	return { handleSelecting, handleSelectFullDay, handleSelectSlot };
}

export function useAgendaCalendarSelection(
	onSelectSlot?: (selection: AgendaSlotSelection) => void,
	createMode?: boolean,
) {
	const isCreateMode = createMode === true;
	const [selectingPreview, setSelectingPreview] = useState<AgendaSlotSelection | null>(null);
	const [hoveredSlot, setHoveredSlot] = useState<HoveredAgendaSlot | null>(null);
	const isSelectingRef = useRef(false);
	const selectionCompletedRef = useRef(false);
	const clearHoverTimeoutRef = useRef<number | undefined>(undefined);
	const createModeRef = useRef(isCreateMode);
	createModeRef.current = isCreateMode;

	useAgendaSelectionEffects(
		onSelectSlot,
		isCreateMode,
		setSelectingPreview,
		setHoveredSlot,
		isSelectingRef,
		selectionCompletedRef,
		clearHoverTimeoutRef,
	);

	const handlers = useAgendaSelectionHandlers(
		onSelectSlot,
		setSelectingPreview,
		setHoveredSlot,
		isSelectingRef,
		selectionCompletedRef,
		createModeRef,
	);

	return {
		selectingPreview,
		hoveredSlot,
		setHoveredSlot,
		clearHoverTimeoutRef,
		...handlers,
	};
}
