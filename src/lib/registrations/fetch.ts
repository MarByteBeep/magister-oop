import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';

const cache = new Map<string, RegistrationsResponse>();
const inflight = new Map<string, Promise<RegistrationsResponse>>();

export function invalidateRegistrationCache(dateKeys: string[]) {
	for (const dateKey of dateKeys) {
		cache.delete(dateKey);
		inflight.delete(dateKey);
	}
}

export async function getRegistrationsForDate(dateKey: string): Promise<RegistrationsResponse> {
	const cached = cache.get(dateKey);
	if (cached) return cached;

	const pending = inflight.get(dateKey);
	if (pending) return pending;

	let request!: Promise<RegistrationsResponse>;
	request = (async () => {
		try {
			const data = await loadRegistrations(dateKey);
			if (inflight.get(dateKey) === request) cache.set(dateKey, data);
			return data;
		} finally {
			if (inflight.get(dateKey) === request) inflight.delete(dateKey);
		}
	})();
	inflight.set(dateKey, request);
	return request;
}

/** Always hits the network. Updates the cache on success. */
export async function refreshRegistrations(dateKey: string): Promise<RegistrationsResponse> {
	const data = await loadRegistrations(dateKey);
	cache.set(dateKey, data);
	return data;
}

function loadRegistrations(dateKey: string): Promise<RegistrationsResponse> {
	return getJson<RegistrationsResponse>(endpoints.registrations(dateKey), 'include', 'no-cache');
}
