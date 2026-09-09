import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { AbsenceNotice, AbsenceNoticesResponse } from '@/magister/response/absence-notice.types';

const cache = new Map<string, AbsenceNotice[]>();
const inflight = new Map<string, Promise<AbsenceNotice[]>>();

export function invalidateAbsenceNoticeCache(dateKeys: string[]) {
	for (const dateKey of dateKeys) {
		cache.delete(dateKey);
		inflight.delete(dateKey);
	}
}

export async function getAbsenceNoticesForDate(dateKey: string): Promise<AbsenceNotice[]> {
	const cached = cache.get(dateKey);
	if (cached) return cached;

	const pending = inflight.get(dateKey);
	if (pending) return pending;

	let request!: Promise<AbsenceNotice[]>;
	request = (async () => {
		try {
			const items = await loadAbsenceNoticesForDate(dateKey);
			// After invalidate(), inflight no longer holds this promise — so a late response
			// must neither populate the cache nor clear a newer request's slot (same check in finally).
			if (inflight.get(dateKey) === request) cache.set(dateKey, items);
			return items;
		} catch (error) {
			console.warn('Failed to fetch absence notices for', dateKey, error);
			return [];
		} finally {
			if (inflight.get(dateKey) === request) inflight.delete(dateKey);
		}
	})();
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

async function loadAbsenceNoticesForDate(dateKey: string): Promise<AbsenceNotice[]> {
	const data = await getJson<AbsenceNoticesResponse>(endpoints.absenceNotices(dateKey), 'omit', 'no-cache', 'bearer');
	const items = data.items ?? [];
	if (typeof data.count === 'number' && data.count !== items.length) {
		console.warn(`Absence notices for ${dateKey} may be truncated: count=${data.count}, items=${items.length}`);
	}
	return items;
}
