import { useCallback, useState } from 'react';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

/** Shared selection state for day/week agenda views (entry modal + new appointment). */
export function useAgendaViewDialogs() {
	const [selectedEntry, setSelectedEntry] = useState<AgendaEntry | null>(null);
	const [draftSelection, setDraftSelection] = useState<AgendaSlotSelection | null>(null);

	const onSelectEntry = useCallback((entry: AgendaEntry) => setSelectedEntry(entry), []);
	const onSelectSlot = useCallback((selection: AgendaSlotSelection) => setDraftSelection(selection), []);
	const clearSelectedEntry = useCallback(() => setSelectedEntry(null), []);
	const clearDraftSelection = useCallback(() => setDraftSelection(null), []);

	return {
		selectedEntry,
		draftSelection,
		onSelectEntry,
		onSelectSlot,
		clearSelectedEntry,
		clearDraftSelection,
	};
}
