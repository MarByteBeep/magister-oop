import { isRegistrationEntry } from '@/lib/agenda/entryUtils';
import { registrationEntriesForStudent } from '@/lib/registrations/entries';
import { getRegistrationsForDate, invalidateRegistrationCache } from '@/lib/registrations/fetch';
import type { AgendaEntry, RegistrationAgendaEntry } from '@/magister/response/agendaEntry.types';

function dayAgendaEntries(existingAgenda: Record<string, AgendaEntry[]> | undefined, dateKey: string): AgendaEntry[] {
	if (!existingAgenda) return [];
	const dayEntries = existingAgenda[dateKey];
	if (!dayEntries) return [];
	return dayEntries;
}

function keepExistingRegistrationEntries(
	existingAgenda: Record<string, AgendaEntry[]> | undefined,
	dateKey: string,
): RegistrationAgendaEntry[] {
	return dayAgendaEntries(existingAgenda, dateKey).filter(isRegistrationEntry);
}

function appendFulfilledRegistrations(
	entries: RegistrationAgendaEntry[],
	registrations: Awaited<ReturnType<typeof getRegistrationsForDate>>,
	studentId: number,
): void {
	entries.push(...registrationEntriesForStudent(registrations, studentId));
}

function appendFailedDayRegistrations(
	entries: RegistrationAgendaEntry[],
	dateKey: string,
	reason: unknown,
	existingAgenda: Record<string, AgendaEntry[]> | undefined,
): void {
	console.warn('Failed to fetch registrations for', dateKey, reason);
	entries.push(...keepExistingRegistrationEntries(existingAgenda, dateKey));
}

function appendSettledDayRegistrations(
	entries: RegistrationAgendaEntry[],
	dateKey: string,
	result: PromiseSettledResult<Awaited<ReturnType<typeof getRegistrationsForDate>>>,
	studentId: number,
	existingAgenda: Record<string, AgendaEntry[]> | undefined,
): void {
	if (result.status === 'fulfilled') {
		appendFulfilledRegistrations(entries, result.value, studentId);
		return;
	}
	appendFailedDayRegistrations(entries, dateKey, result.reason, existingAgenda);
}

function appendDayIfPresent(
	entries: RegistrationAgendaEntry[],
	dateKey: string | undefined,
	result: PromiseSettledResult<Awaited<ReturnType<typeof getRegistrationsForDate>>>,
	studentId: number,
	existingAgenda: Record<string, AgendaEntry[]> | undefined,
): void {
	if (!dateKey) return;
	appendSettledDayRegistrations(entries, dateKey, result, studentId, existingAgenda);
}

function collectRegistrationEntries(
	results: PromiseSettledResult<Awaited<ReturnType<typeof getRegistrationsForDate>>>[],
	dateKeys: string[],
	studentId: number,
	existingAgenda: Record<string, AgendaEntry[]> | undefined,
): RegistrationAgendaEntry[] {
	const entries: RegistrationAgendaEntry[] = [];
	for (const [index, result] of results.entries()) {
		appendDayIfPresent(entries, dateKeys[index], result, studentId, existingAgenda);
	}
	return entries;
}

/** Registrations for one student across the requested days. A failed day keeps its current overlays. */
export async function loadRegistrationEntriesForStudent(
	studentId: number,
	dateKeys: string[],
	existingAgenda: Record<string, AgendaEntry[]> | undefined,
	refresh: boolean,
): Promise<RegistrationAgendaEntry[]> {
	if (refresh) invalidateRegistrationCache(dateKeys);
	const results = await Promise.allSettled(dateKeys.map((dateKey) => getRegistrationsForDate(dateKey)));
	return collectRegistrationEntries(results, dateKeys, studentId, existingAgenda);
}
