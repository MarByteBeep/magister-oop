import { eachMonthKey, getMonthKey, getMonthRange, parseDateKey } from '@/lib/dateUtils';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { ReturnMeasureStudent, ReturnMeasureStudentsResponse } from '@/magister/response/return-measure.types';

const cache = new Map<string, ReturnMeasureStudent[]>();
const inflight = new Map<string, Promise<ReturnMeasureStudent[]>>();

/** Magister asks for the local month start through the local start of the month's last day. */
function monthRange(monthKey: string): { start: string; end: string } {
	const { start, end } = getMonthRange(parseDateKey(`${monthKey}-01`));
	return { start: start.toISOString(), end: end.toISOString() };
}

export function invalidateReturnMeasureCache(monthKeys: string[]) {
	for (const monthKey of monthKeys) {
		cache.delete(monthKey);
		inflight.delete(monthKey);
	}
}

export async function getReturnMeasuresForMonth(monthKey: string): Promise<ReturnMeasureStudent[]> {
	const cached = cache.get(monthKey);
	if (cached) return cached;

	const pending = inflight.get(monthKey);
	if (pending) return pending;

	let request!: Promise<ReturnMeasureStudent[]>;
	request = (async () => {
		try {
			const items = await loadReturnMeasuresForMonth(monthKey);
			cache.set(monthKey, items);
			return items;
		} catch (error) {
			console.warn('Failed to fetch return measures for', monthKey, error);
			return [];
		} finally {
			if (inflight.get(monthKey) === request) inflight.delete(monthKey);
		}
	})();
	inflight.set(monthKey, request);
	return request;
}

/** Every measure covering the inclusive day range, fetching each month it spans. */
export async function getReturnMeasuresForRange(rangeStart: Date, rangeEnd: Date): Promise<ReturnMeasureStudent[]> {
	const months = await Promise.all(eachMonthKey(rangeStart, rangeEnd).map(getReturnMeasuresForMonth));
	return months.flat();
}

/** Always hits the network. Returns null on failure so callers keep the measures they already show. */
export async function refreshReturnMeasuresForDate(dateKey: string): Promise<ReturnMeasureStudent[] | null> {
	const monthKey = getMonthKey(parseDateKey(dateKey));
	try {
		const items = await loadReturnMeasuresForMonth(monthKey);
		cache.set(monthKey, items);
		return items;
	} catch (error) {
		console.warn('Failed to refresh return measures for', monthKey, error);
		return null;
	}
}

async function loadReturnMeasuresForMonth(monthKey: string): Promise<ReturnMeasureStudent[]> {
	const { start, end } = monthRange(monthKey);
	const data = await getJson<ReturnMeasureStudentsResponse>(
		endpoints.returnMeasures(start, end),
		'include',
		'no-cache',
	);
	return data.items ?? [];
}
