import { useRef } from 'react';
import { agendaEntriesEqual, isSameAgendaEntryOccurrence } from '@/lib/agendaEntryUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';

export function useStableAgendaEntries(entries: AgendaEntry[]): AgendaEntry[] {
	const stableRef = useRef(entries);
	if (!agendaEntriesEqual(entries, stableRef.current)) {
		stableRef.current = entries;
	}
	return stableRef.current;
}

export function useStableAgendaEntry(entry: AgendaEntry | null | undefined): AgendaEntry | null | undefined {
	const stableRef = useRef(entry);
	if (entry == null) {
		stableRef.current = entry;
		return entry;
	}
	if (stableRef.current != null && isSameAgendaEntryOccurrence(entry, stableRef.current)) {
		return stableRef.current;
	}
	stableRef.current = entry;
	return entry;
}
