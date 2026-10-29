import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { AbsenceNotice, AbsenceNoticesResponse } from '@/magister/response/absenceNotice.types';
import { isMagisterUnavailableError } from '@/magister/sessionErrors';

const cache = new Map<string, AbsenceNotice[]>();
const inflight = new Map<string, Promise<AbsenceNotice[]>>();

export function invalidateAbsenceNoticeCache(dateKeys: string[]) {
	for (const dateKey of dateKeys) {
		cache.delete(dateKey);
		inflight.delete(dateKey);
	}
}

function storeIfCurrentRequest(dateKey: string, request: Promise<AbsenceNotice[]>, items: AbsenceNotice[]): void {
	if (inflight.get(dateKey) === request) cache.set(dateKey, items);
}

function clearIfCurrentRequest(dateKey: string, request: Promise<AbsenceNotice[]>): void {
	if (inflight.get(dateKey) === request) inflight.delete(dateKey);
}

function logAbsenceFetchError(dateKey: string, error: unknown): void {
	if (isMagisterUnavailableError(error)) return;
	console.error('Failed to fetch absence notices for', dateKey, error);
}

async function fetchAbsenceNoticesRequest(
	dateKey: string,
	request: Promise<AbsenceNotice[]>,
): Promise<AbsenceNotice[]> {
	try {
		const items = await loadAbsenceNoticesForDate(dateKey);
		// After invalidate(), inflight no longer holds this promise — so a late response
		// must neither populate the cache nor clear a newer request's slot (same check in finally).
		storeIfCurrentRequest(dateKey, request, items);
		return items;
	} catch (error) {
		logAbsenceFetchError(dateKey, error);
		throw error;
	} finally {
		clearIfCurrentRequest(dateKey, request);
	}
}

export async function getAbsenceNoticesForDate(dateKey: string): Promise<AbsenceNotice[]> {
	const cached = cache.get(dateKey);
	if (cached) return cached;

	const pending = inflight.get(dateKey);
	if (pending) return pending;

	let request!: Promise<AbsenceNotice[]>;
	request = (async () => fetchAbsenceNoticesRequest(dateKey, request))();
	inflight.set(dateKey, request);
	return request;
}

/** Always hits the network. Updates the cache on success; returns null on failure so callers keep the current overlays. */
export async function refreshAbsenceNoticesForDate(dateKey: string): Promise<AbsenceNotice[] | null> {
	try {
		const items = await loadAbsenceNoticesForDate(dateKey);
		cache.set(dateKey, items);
		return items;
	} catch (error) {
		console.warn('Failed to refresh absence notices for', dateKey, error);
		return null;
	}
}

function shouldWarnTruncation(count: number | undefined, itemCount: number): boolean {
	if (typeof count !== 'number') return false;
	return count !== itemCount;
}

async function loadAbsenceNoticesForDate(dateKey: string): Promise<AbsenceNotice[]> {
	const data = await getJson<AbsenceNoticesResponse>(endpoints.absenceNotices(dateKey), 'omit', 'no-cache', 'bearer');
	const items = data.items ?? [];
	if (shouldWarnTruncation(data.count, items.length)) {
		console.warn(`Absence notices for ${dateKey} may be truncated: count=${data.count}, items=${items.length}`);
	}
	return items;
}
