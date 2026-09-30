import { useCallback, useRef, useState } from 'react';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

/** Shared selection state for day/week agenda views (entry modal + new appointment). */
export function useAgendaViewDialogs() {
	const [selectedEntry, setSelectedEntry] = useState<AgendaEntry | null>(null);
	const [draftSelection, setDraftSelection] = useState<AgendaSlotSelection | null>(null);
	const draftSelectionRef = useRef<AgendaSlotSelection | null>(null);
	const ignoreSlotSelectRef = useRef(false);

	draftSelectionRef.current = draftSelection;

	const onSelectEntry = useCallback((entry: AgendaEntry) => setSelectedEntry(entry), []);

	const onSelectSlot = useCallback((selection: AgendaSlotSelection) => {
		// Dialog unmount removes the overlay mid-click; ignore the fall-through select.
		if (ignoreSlotSelectRef.current || draftSelectionRef.current) return;
		setDraftSelection(selection);
	}, []);

	const clearSelectedEntry = useCallback(() => setSelectedEntry(null), []);

	const clearDraftSelection = useCallback(() => {
		setDraftSelection(null);
		ignoreSlotSelectRef.current = true;

		const finish = () => {
			window.removeEventListener('pointerup', finish, true);
			window.removeEventListener('pointercancel', finish, true);
			window.clearTimeout(safetyId);
			// After click (fired after pointerup in the same turn), so the agenda
			// does not treat the dismiss click as a new slot selection.
			window.setTimeout(() => {
				ignoreSlotSelectRef.current = false;
			}, 0);
		};

		const safetyId = window.setTimeout(finish, 300);
		window.addEventListener('pointerup', finish, true);
		window.addEventListener('pointercancel', finish, true);
	}, []);

	return {
		selectedEntry,
		draftSelection,
		onSelectEntry,
		onSelectSlot,
		clearSelectedEntry,
		clearDraftSelection,
	};
}
