import { useCallback, useEffect, useRef, useState } from 'react';
import type { SlotInfo } from 'react-big-calendar';
import { findHoveredAgendaSlotAtPoint } from '@/hooks/agenda/agendaCalendarPropGetters';
import { hoveredSlotFromSelection, resolveAgendaHoverSelection } from '@/hooks/agenda/resolveAgendaHoverSelection';
import { getFullDayScheduleSelection } from '@/lib/agenda/fullDayScheduleUtils';
import { type HoveredAgendaSlot, snapSelectionToLessonHours } from '@/lib/agenda/lessonHours';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { isAllDaySlotSelection, slotInfoToSelection } from '@/lib/agenda/slotSelection';

export type TransformAgendaSelection = (selection: AgendaSlotSelection) => AgendaSlotSelection | null;

export type AgendaSelectSlotMeta = { additive?: boolean };

export type AgendaSelectSlotHandler = (selection: AgendaSlotSelection, meta?: AgendaSelectSlotMeta) => void;

function applyTransform(
	selection: AgendaSlotSelection | null,
	transformSelection?: TransformAgendaSelection,
): AgendaSlotSelection | null {
	if (!selection) return null;
	if (!transformSelection) return selection;
	return transformSelection(selection);
}

export function useAgendaCalendarSelection(
	onSelectSlot?: AgendaSelectSlotHandler,
	createMode = false,
	transformSelection?: TransformAgendaSelection,
) {
	const [selectingPreview, setSelectingPreview] = useState<AgendaSlotSelection | null>(null);
	const [hoveredSlot, setHoveredSlot] = useState<HoveredAgendaSlot | null>(null);
	const isSelectingRef = useRef(false);
	const selectionCompletedRef = useRef(false);
	const clearHoverTimeoutRef = useRef<number | undefined>(undefined);
	const pointerRef = useRef<{ x: number; y: number } | null>(null);
	const modifierRef = useRef(false);
	const createModeRef = useRef(createMode);
	const transformRef = useRef(transformSelection);
	createModeRef.current = createMode;
	transformRef.current = transformSelection;

	const handleSelecting = useCallback((range: { start: Date; end: Date }): boolean | undefined => {
		if (!createModeRef.current) return false;
		isSelectingRef.current = true;
		selectionCompletedRef.current = false;
		setHoveredSlot(null);
		const snapped = snapSelectionToLessonHours(range);
		setSelectingPreview(applyTransform(snapped, transformRef.current));
		return undefined;
	}, []);

	const handleSelectFullDay = useCallback(
		(day: Date) => {
			if (!onSelectSlot || !createModeRef.current) return;
			setSelectingPreview(null);
			setHoveredSlot(null);
			const selection = applyTransform(getFullDayScheduleSelection(day), transformRef.current);
			if (selection) onSelectSlot(selection, { additive: modifierRef.current });
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
			const selection = applyTransform(snapped, transformRef.current);
			if (!selection) return;
			// Drag (action select) always replaces; Ctrl/Cmd+click toggles additively.
			const additive = modifierRef.current && slotInfo.action === 'click';
			onSelectSlot(selection, { additive });
		},
		[onSelectSlot],
	);

	useEffect(() => {
		if (!onSelectSlot) return;

		const trackPointer = (event: PointerEvent) => {
			pointerRef.current = { x: event.clientX, y: event.clientY };
			modifierRef.current = event.ctrlKey || event.metaKey;
		};

		window.addEventListener('pointermove', trackPointer, { passive: true });
		window.addEventListener('pointerdown', trackPointer, { passive: true });
		window.addEventListener('pointerup', trackPointer, { passive: true });
		return () => {
			window.removeEventListener('pointermove', trackPointer);
			window.removeEventListener('pointerdown', trackPointer);
			window.removeEventListener('pointerup', trackPointer);
		};
	}, [onSelectSlot]);

	useEffect(() => {
		if (!createMode) {
			window.clearTimeout(clearHoverTimeoutRef.current);
			setSelectingPreview(null);
			setHoveredSlot(null);
			return;
		}

		const point = pointerRef.current;
		if (!point) return;
		const slot = findHoveredAgendaSlotAtPoint(point.x, point.y);
		if (!slot) return;
		const resolved = resolveAgendaHoverSelection(slot, transformRef.current);
		if (!resolved) return;
		setHoveredSlot(transformRef.current ? hoveredSlotFromSelection(resolved) : slot);
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
