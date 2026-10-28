import { requestMagisterSessionVerification } from '@/lib/session/magisterSession';
import { jsonCacheGet, jsonCacheSet, loadJsonCache } from '@/lib/shared/cache';
import { fetchBlobInMagisterTab } from '@/magister/fetchBlobInMagisterTab';
import { magisterTabJsonInPage } from '@/magister/magisterTabJsonInPage';
import { schoolApiHttpErrorMessage } from '@/magister/schoolApiHttpError';
import { type SendJsonMethod, type SendJsonResult, sendJsonResponseToResult } from '@/magister/sendJsonResult';
import {
	isMagisterUnavailableError,
	MAGISTER_SESSION_EXPIRED_MESSAGE,
	MAGISTER_TAB_UNAVAILABLE_MESSAGE,
	MAGISTER_TOKEN_MISSING_MESSAGE,
} from '@/magister/sessionErrors';
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

/**
 * POST JSON data to an endpoint.
 * `ok: true` means HTTP 2xx; non-success status codes become `ok: false` with an error message.
 */
export async function postJson(
	url: string,
	body: unknown,
	credentials: CredentialsOption = 'include',
	auth: AuthOption = 'cookies',
): Promise<SendJsonResult> {
	return sendJson(url, 'POST', body, credentials, auth);
}

/**
 * PUT JSON data to an endpoint.
 * `ok: true` means HTTP 2xx; non-success status codes become `ok: false` with an error message.
 */
export async function putJson(
	url: string,
	body: unknown,
	credentials: CredentialsOption = 'include',
	auth: AuthOption = 'cookies',
): Promise<SendJsonResult> {
	return sendJson(url, 'PUT', body, credentials, auth);
}

/**
 * DELETE an endpoint.
 * `ok: true` means HTTP 2xx; non-success status codes become `ok: false` with an error message.
 */
export async function deleteJson(
	url: string,
	credentials: CredentialsOption = 'include',
	auth: AuthOption = 'cookies',
): Promise<SendJsonResult> {
	return sendJson(url, 'DELETE', null, credentials, auth);
}

async function sendJson(
	url: string,
	method: SendJsonMethod,
	body: unknown,
	credentials: CredentialsOption,
	auth: AuthOption,
): Promise<SendJsonResult> {
	try {
		if (import.meta.env.DEV) {
			console.log(`[DEV] ${method} json`, url);
			const hasBody = method !== 'DELETE' && body !== undefined && body !== null;
			const res = await fetch(url, {
				method,
				headers: hasBody
					? { 'Content-Type': 'application/json', Accept: 'application/json' }
					: { Accept: 'application/json' },
				body: hasBody ? JSON.stringify(body) : undefined,
			});

			if (!res.ok) return sendJsonResponseToResult(res);

			try {
				const data = (await res.json()) as unknown;
				return sendJsonResponseToResult(res, data);
			} catch {
				return sendJsonResponseToResult(res);
			}
		}

		const result = await executeInActiveMagisterTab(magisterTabJsonInPage, [
			{
				method,
				url,
				credentials,
				auth,
				body,
				sessionExpiredMessage: MAGISTER_SESSION_EXPIRED_MESSAGE,
				tokenMissingMessage: MAGISTER_TOKEN_MISSING_MESSAGE,
			},
		]);

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

const TAB_UNAVAILABLE: ScriptError = { ok: false, error: MAGISTER_TAB_UNAVAILABLE_MESSAGE };

/** Chrome errors when the tab closed, reloaded, or navigated off Magister between lookup and injection. */
const TAB_GONE_ERROR_PARTS = ['No tab with id', 'Frame with ID', 'Cannot access contents of'];

/** A school 404 also maps to the expired message; the background re-check makes that harmless. */
async function executeInActiveMagisterTab<T, Args extends unknown[]>(
	func: (...args: Args) => Promise<T>,
	args: Args,
): Promise<T | ScriptError> {
	const result = await executeWithTabRetry(func, args);
	if (isScriptError(result) && isMagisterUnavailableError(result.error)) requestMagisterSessionVerification();
	return result;
}

async function executeWithTabRetry<T, Args extends unknown[]>(
	func: (...args: Args) => Promise<T>,
	args: Args,
): Promise<T | ScriptError> {
	const tabId = await resolveActiveMagisterTabId();
	if (tabId === undefined) return TAB_UNAVAILABLE;
	await sleep(Math.random() * 250);

	const first = await executeScriptInTab(tabId, func, args);
	if (!isTabGoneError(first)) return first;

	await chrome.storage.session.remove('activeTabId');
	const retryId = await resolveActiveMagisterTabId();
	if (retryId === undefined) return TAB_UNAVAILABLE;
	const retry = await executeScriptInTab(retryId, func, args);
	return isTabGoneError(retry) ? TAB_UNAVAILABLE : retry;
}

function isScriptError<T>(result: T | ScriptError): result is ScriptError {
	return typeof result === 'object' && result !== null && 'ok' in result && result.ok === false;
}

function isTabGoneError<T>(result: T | ScriptError): result is ScriptError {
	return isScriptError(result) && TAB_GONE_ERROR_PARTS.some((part) => result.error.includes(part));
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

		const result = await executeInActiveMagisterTab(magisterTabJsonInPage, [
			{
				method: 'GET',
				url,
				credentials,
				auth,
				body: null,
				sessionExpiredMessage: MAGISTER_SESSION_EXPIRED_MESSAGE,
				tokenMissingMessage: MAGISTER_TOKEN_MISSING_MESSAGE,
			},
		]);

		if (!result.ok) return result;
		if (cache !== 'no-cache') {
			await jsonCacheSet(url, result.data as T);
		}
		return { ok: true, data: result.data as T };
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
