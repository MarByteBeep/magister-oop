import { isRegistrationEntry } from '@/lib/agenda/entryUtils';
import { registrationEntriesForStudent } from '@/lib/registrations/entries';
import { getRegistrationsForDate, invalidateRegistrationCache } from '@/lib/registrations/fetch';
import type { AgendaEntry, RegistrationAgendaEntry } from '@/magister/response/agendaEntry.types';

/** Registrations for one student across the requested days. A failed day keeps its current overlays. */
export async function loadRegistrationEntriesForStudent(
	studentId: number,
	dateKeys: string[],
	existingAgenda: Record<string, AgendaEntry[]> | undefined,
	refresh: boolean,
): Promise<RegistrationAgendaEntry[]> {
	if (refresh) invalidateRegistrationCache(dateKeys);

	const results = await Promise.allSettled(dateKeys.map((dateKey) => getRegistrationsForDate(dateKey)));
	const entries: RegistrationAgendaEntry[] = [];

	for (const [index, result] of results.entries()) {
		const dateKey = dateKeys[index];
		if (!dateKey) continue;

		if (result.status === 'fulfilled') {
			entries.push(...registrationEntriesForStudent(result.value, studentId));
			continue;
		}

		console.warn('Failed to fetch registrations for', dateKey, result.reason);
		for (const entry of existingAgenda?.[dateKey] ?? []) {
			if (isRegistrationEntry(entry)) entries.push(entry);
		}
	}

	return entries;
}
