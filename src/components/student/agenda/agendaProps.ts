import type { View } from 'react-big-calendar';
import type { AgendaSelectionMode } from '@/hooks/agenda/agendaSelectionMode';
import type { TransformAgendaSelection } from '@/hooks/agenda/useAgendaCalendarSelection';
import { agendaEntriesEqual, isSameAgendaEntryOccurrence } from '@/lib/agenda/entryUtils';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

export interface AgendaProps {
	entries: AgendaEntry[];
	date: Date;
	view: View;
	activeEntry?: AgendaEntry | null;
	onSelectEntry: (entry: AgendaEntry) => void;
	onSelectSlot?: (selection: AgendaSlotSelection) => void;
	draftSelection?: AgendaSlotSelection | null;
	/** Label shown on the draft overlay (e.g. reschedule description). */
	draftLabel?: string | null;
	selectionMode?: AgendaSelectionMode;
	highlightDateKey?: string | null;
	/** When set in create/reschedule mode, only this measure stays highlighted; others mute. */
	focusReturnMeasureId?: number | null;
	transformSelection?: TransformAgendaSelection;
}

export function agendaPropsEqual(prev: AgendaProps, next: AgendaProps): boolean {
	if (prev.view !== next.view || prev.draftSelection !== next.draftSelection) return false;
	if (prev.draftLabel !== next.draftLabel) return false;
	if (prev.focusReturnMeasureId !== next.focusReturnMeasureId) return false;
	if (prev.selectionMode !== next.selectionMode || prev.highlightDateKey !== next.highlightDateKey) return false;
	if (prev.transformSelection !== next.transformSelection) return false;
	if (prev.onSelectSlot !== next.onSelectSlot || prev.onSelectEntry !== next.onSelectEntry) return false;
	if (prev.date.getTime() !== next.date.getTime()) return false;
	if (!agendaEntriesEqual(prev.entries, next.entries)) return false;
	if (prev.activeEntry === next.activeEntry) return true;
	return isSameAgendaEntryOccurrence(prev.activeEntry, next.activeEntry);
}
