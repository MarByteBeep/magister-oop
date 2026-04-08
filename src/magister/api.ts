import { jsonCacheGet, jsonCacheSet, loadJsonCache } from '@/lib/cache';

type CredentialsOption = 'include' | 'omit' | 'same-origin';
type CacheOption = 'cache' | 'cache-write-only' | 'no-cache';
type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

type FetchResult<T = JSONValue> = { ok: true; data: T } | { ok: false; error: string };

type FetchBlobResult = { ok: true; blob: { buffer: ArrayBuffer; type: string } } | { ok: false; error: string };

export async function getJson<T = JSONValue>(
	url: string,
	credentials: CredentialsOption = 'include',
	cache: CacheOption = 'cache',
): Promise<T> {
	const result = await getJsonImpl<T>(url, credentials, cache);
	if (!result.ok) throw new Error(result.error);
	return result.data;
}

export async function getBlob(url: string): Promise<Blob> {
	const result = await getBlobImpl(url);

	if (!result.ok) throw new Error(result.error);
	const { buffer, type } = result.blob;
	const blob = new Blob([buffer], { type });
	return blob;
}

type PostResult = { ok: true; status: number } | { ok: false; error: string };

/**
 * POST JSON data to an endpoint
 * Returns the response status code for checking
 */
export async function postJson(
	url: string,
	body: unknown,
	credentials: CredentialsOption = 'include',
): Promise<PostResult> {
	return postJsonImpl(url, body, credentials);
}

async function postJsonImpl(url: string, body: unknown, credentials: CredentialsOption): Promise<PostResult> {
	try {
		if (import.meta.env.DEV) {
			console.log(`[DEV] POST json`, url);
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			return { ok: true, status: res.status };
		}

		const tabId = Number((await chrome.storage.session.get('activeTabId')).activeTabId);

		if (Number.isNaN(tabId)) return { ok: false, error: 'no active magister tab' };
		await sleep(Math.random() * 250);

		const [result] = await chrome.scripting.executeScript({
			target: { tabId },
			world: 'MAIN',
			func: async (
				fetchUrl: string,
				requestBody: unknown,
				requestCredentials: CredentialsOption,
			): Promise<PostResult> => {
				try {
					const res = await fetch(fetchUrl, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						credentials: requestCredentials,
						body: JSON.stringify(requestBody),
					});

					return { ok: true, status: res.status };
				} catch (err) {
					return { ok: false, error: (err as Error).message };
				}
			},
			args: [url, body, credentials],
		});

		if (result.result) return result.result;
		return { ok: false, error: 'unknown' };
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Shown when Magister returns 404 (session cookies invalid or expired). */
const MAGISTER_SESSION_EXPIRED_MESSAGE =
	'De Magister-sessie is ongeldig of verlopen. ' +
	'Log opnieuw in op Magister in een browsertab en open daarna deze extensie opnieuw.';

function httpErrorMessage(status: number): string {
	if (status === 404) return MAGISTER_SESSION_EXPIRED_MESSAGE;
	return `HTTP error ${status}`;
}

await loadJsonCache();

async function getJsonImpl<T>(
	url: string,
	credentials: CredentialsOption,
	cache: CacheOption,
): Promise<FetchResult<T>> {
	if (cache === 'cache') {
		const cacheEntry = jsonCacheGet<T>(url);
		if (cacheEntry) {
			console.log(`[JSON CACHE] ${url}`);
			return {
				ok: true,
				data: cacheEntry,
			};
		}
	}

	try {
		if (import.meta.env.DEV) {
			console.log(`[DEV] fetch json`, url);
			const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });

			if (!res.ok) return { ok: false, error: httpErrorMessage(res.status) };

			const data = (await res.json()) as T;
			if (cache !== 'no-cache') {
				await jsonCacheSet(url, data);
			}
			return { ok: true, data };
		}

		const tabId = Number((await chrome.storage.session.get('activeTabId')).activeTabId);

		if (Number.isNaN(tabId)) return { ok: false, error: 'no active magister tab' };
		await sleep(Math.random() * 250);

		const [result] = await chrome.scripting.executeScript({
			target: { tabId },
			world: 'MAIN',
			func: async (
				fetchUrl: string,
				credentials: CredentialsOption,
				sessionExpiredMessage: string,
			): Promise<FetchResult<T>> => {
				try {
					const res = await fetch(fetchUrl, {
						method: 'GET',
						credentials,
					});

					if (!res.ok) {
						const error = res.status === 404 ? sessionExpiredMessage : `HTTP error ${res.status}`;
						return { ok: false, error };
					}

					const data = (await res.json()) as T;
					return { ok: true, data };
				} catch (err) {
					return { ok: false, error: (err as Error).message };
				}
			},
			args: [url, credentials, MAGISTER_SESSION_EXPIRED_MESSAGE],
		});

		if (result.result) {
			if (result.result.ok && cache !== 'no-cache') {
				await jsonCacheSet(url, result.result.data);
			}
			return result.result;
		}
		return { ok: false, error: 'unknown' };
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}

async function getBlobImpl(url: string): Promise<FetchBlobResult> {
	try {
		if (import.meta.env.DEV) {
			console.log(`[DEV] fetch blob`, url);
			const res = await fetch(url, { method: 'GET' });

			if (!res.ok) return { ok: false, error: httpErrorMessage(res.status) };

			const blob = await res.blob();
			const buffer = await blob.arrayBuffer();

			return {
				ok: true,
				blob: {
					buffer,
					type: blob.type,
				},
			};
		}

		const tabId = Number((await chrome.storage.session.get('activeTabId')).activeTabId);

		if (Number.isNaN(tabId)) return { ok: false, error: 'no active magister tab' };

		await sleep(Math.random() * 250);

		const [result] = await chrome.scripting.executeScript({
			target: { tabId },
			world: 'MAIN',
			func: async (fetchUrl: string, sessionExpiredMessage: string): Promise<FetchBlobResult> => {
				try {
					const res = await fetch(fetchUrl, {
						method: 'GET',
						credentials: 'include',
					});

					if (!res.ok) {
						const error = res.status === 404 ? sessionExpiredMessage : `HTTP error ${res.status}`;
						return { ok: false, error };
					}

					const blob = await res.blob();
					const buffer = await blob.arrayBuffer();

					return {
						ok: true,
						blob: {
							buffer,
							type: blob.type,
						},
					};
				} catch (err) {
					return { ok: false, error: (err as Error).message };
				}
			},
			args: [url, MAGISTER_SESSION_EXPIRED_MESSAGE],
		});

		if (result.result) return result.result;
		return { ok: false, error: 'unknown' };
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}
