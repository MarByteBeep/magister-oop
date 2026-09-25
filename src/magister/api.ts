import { jsonCacheGet, jsonCacheSet, loadJsonCache } from '@/lib/cache';
import { fetchBlobInMagisterTab } from '@/magister/fetchBlobInMagisterTab';
import { fetchJsonInMagisterTab } from '@/magister/fetchInMagisterTab';
import { postJsonInMagisterTab } from '@/magister/postJsonInMagisterTab';
import { findSchoolSessionTab, isSchoolSessionUrl } from '@/popup-utils/tabs';

type CredentialsOption = 'include' | 'omit' | 'same-origin';
/**
 * School APIs on `{school}.magister.net` authenticate with session cookies, while the
 * platform APIs on other `magister.net` subdomains expect the OIDC access token.
 */
type AuthOption = 'cookies' | 'bearer';
type CacheOption = 'cache' | 'cache-write-only' | 'no-cache';
type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

type FetchResult<T = JSONValue> = { ok: true; data: T } | { ok: false; error: string };

type FetchBlobResult = { ok: true; blob: { buffer: ArrayBuffer; type: string } } | { ok: false; error: string };

export async function getJson<T = JSONValue>(
	url: string,
	credentials: CredentialsOption = 'include',
	cache: CacheOption = 'cache',
	auth: AuthOption = 'cookies',
): Promise<T> {
	const result = await getJsonImpl<T>(url, credentials, cache, auth);
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

		const result = await executeInActiveMagisterTab(postJsonInMagisterTab, [url, body, credentials]);

		return result;
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ScriptError = { ok: false; error: string };

async function resolveActiveMagisterTabId(): Promise<number | undefined> {
	const storedId = Number((await chrome.storage.session.get('activeTabId')).activeTabId);
	if (!Number.isNaN(storedId)) {
		try {
			const tab = await chrome.tabs.get(storedId);
			if (tab.id !== undefined && tab.url && isSchoolSessionUrl(tab.url)) return tab.id;
		} catch {
			// Tab was closed or replaced during login redirects.
		}
	}

	const tab = await findSchoolSessionTab();
	if (tab?.id === undefined) return undefined;
	await chrome.storage.session.set({ activeTabId: tab.id });
	return tab.id;
}

async function executeScriptInTab<T, Args extends unknown[]>(
	tabId: number,
	func: (...args: Args) => Promise<T>,
	args: Args,
): Promise<T | ScriptError> {
	try {
		const [result] = await chrome.scripting.executeScript({
			target: { tabId },
			world: 'MAIN',
			func,
			args,
		});

		if (result.result) return result.result;
		return { ok: false, error: 'unknown' };
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}

async function executeInActiveMagisterTab<T, Args extends unknown[]>(
	func: (...args: Args) => Promise<T>,
	args: Args,
): Promise<T | ScriptError> {
	const tabId = await resolveActiveMagisterTabId();
	if (tabId === undefined) return { ok: false, error: 'no active magister tab' };
	await sleep(Math.random() * 250);

	const first = await executeScriptInTab(tabId, func, args);
	if (!isMissingTabError(first)) return first;

	await chrome.storage.session.remove('activeTabId');
	const retryId = await resolveActiveMagisterTabId();
	if (retryId === undefined) return { ok: false, error: 'no active magister tab' };
	return executeScriptInTab(retryId, func, args);
}

function isMissingTabError<T>(result: T | ScriptError): result is ScriptError {
	return (
		typeof result === 'object' &&
		result !== null &&
		'ok' in result &&
		result.ok === false &&
		result.error.includes('No tab with id')
	);
}

/** Shown when Magister returns 404 (session cookies invalid or expired). */
const MAGISTER_SESSION_EXPIRED_MESSAGE =
	'De Magister-sessie is ongeldig of verlopen. ' +
	'Log opnieuw in op Magister in een browsertab en open daarna deze extensie opnieuw.';

/** Shown when the Magister tab holds no OIDC access token for the platform APIs. */
const MAGISTER_TOKEN_MISSING_MESSAGE =
	'Geen Magister-token gevonden in de geopende Magister-tab. ' +
	'Ververs de Magister-tab en open daarna deze extensie opnieuw.';

function schoolApiHttpErrorMessage(status: number): string {
	if (status === 404) return MAGISTER_SESSION_EXPIRED_MESSAGE;
	return `HTTP error ${status}`;
}

await loadJsonCache();

async function getJsonImpl<T>(
	url: string,
	credentials: CredentialsOption,
	cache: CacheOption,
	auth: AuthOption,
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

			if (!res.ok) return { ok: false, error: schoolApiHttpErrorMessage(res.status) };

			const data = (await res.json()) as T;
			if (cache !== 'no-cache') {
				await jsonCacheSet(url, data);
			}
			return { ok: true, data };
		}

		const result = await executeInActiveMagisterTab(fetchJsonInMagisterTab<T>, [
			url,
			credentials,
			auth,
			MAGISTER_SESSION_EXPIRED_MESSAGE,
			MAGISTER_TOKEN_MISSING_MESSAGE,
		]);

		if (result.ok && cache !== 'no-cache') {
			await jsonCacheSet(url, result.data);
		}
		return result;
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}

async function getBlobImpl(url: string): Promise<FetchBlobResult> {
	try {
		if (import.meta.env.DEV) {
			console.log(`[DEV] fetch blob`, url);
			const res = await fetch(url, { method: 'GET' });

			if (!res.ok) return { ok: false, error: schoolApiHttpErrorMessage(res.status) };

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

		return executeInActiveMagisterTab(fetchBlobInMagisterTab, [url, MAGISTER_SESSION_EXPIRED_MESSAGE]);
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}
