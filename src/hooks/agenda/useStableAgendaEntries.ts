import { useRef } from 'react';
import { agendaEntriesEqual, isSameAgendaEntryOccurrence } from '@/lib/agenda/entryUtils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

export function useStableAgendaEntries(entries: AgendaEntry[]): AgendaEntry[] {
	const stableRef = useRef(entries);
	if (!agendaEntriesEqual(entries, stableRef.current)) {
		stableRef.current = entries;
	}
	return stableRef.current;
}

function isNullishEntry(entry: AgendaEntry | null | undefined): entry is null | undefined {
	if (entry === null) return true;
	return entry === undefined;
}

function canReuseStableEntry(stable: AgendaEntry | null | undefined, entry: AgendaEntry): stable is AgendaEntry {
	if (isNullishEntry(stable)) return false;
	return isSameAgendaEntryOccurrence(entry, stable);
}

export function useStableAgendaEntry(entry: AgendaEntry | null | undefined): AgendaEntry | null | undefined {
	const stableRef = useRef(entry);
	if (isNullishEntry(entry)) {
		stableRef.current = entry;
		return entry;
	}
	if (canReuseStableEntry(stableRef.current, entry)) return stableRef.current;
	stableRef.current = entry;
	return entry;
}
