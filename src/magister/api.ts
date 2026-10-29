import { requestMagisterSessionVerification } from '@/lib/session/magisterSession';
import { jsonCacheGet, jsonCacheSet, loadJsonCache } from '@/lib/shared/cache';
import { fetchBlobInMagisterTab } from '@/magister/fetchBlobInMagisterTab';
import {
	type AuthOption,
	type CredentialsOption,
	type MagisterTabJsonMethod,
	type MagisterTabJsonRequest,
	magisterTabJsonInPage,
} from '@/magister/magisterTabJsonInPage';
import { readOidcAccessTokenInPage } from '@/magister/oidcAccessTokenInPage';
import { schoolApiHttpErrorMessage } from '@/magister/schoolApiHttpError';
import { type SendJsonMethod, type SendJsonResult, sendJsonResponseToResult } from '@/magister/sendJsonResult';
import {
	isMagisterUnavailableError,
	MAGISTER_SESSION_EXPIRED_MESSAGE,
	MAGISTER_TAB_UNAVAILABLE_MESSAGE,
	MAGISTER_TOKEN_MISSING_MESSAGE,
} from '@/magister/sessionErrors';
import { findSchoolSessionTab, isSchoolSessionUrl } from '@/popup-utils/tabs';

export type CacheOption = 'cache' | 'cache-write-only' | 'no-cache';
export type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

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

function sendJsonHasBody(method: SendJsonMethod, body: unknown): boolean {
	if (method === 'DELETE') return false;
	if (body === undefined) return false;
	return body !== null;
}

function sendJsonDevHeaders(hasBody: boolean): HeadersInit {
	if (hasBody) return { 'Content-Type': 'application/json', Accept: 'application/json' };
	return { Accept: 'application/json' };
}

function sendJsonDevBody(hasBody: boolean, body: unknown): string | undefined {
	if (!hasBody) return undefined;
	return JSON.stringify(body);
}

async function parseSendJsonDevResponse(res: Response): Promise<SendJsonResult> {
	try {
		const data = (await res.json()) as unknown;
		return sendJsonResponseToResult(res, data);
	} catch {
		return sendJsonResponseToResult(res);
	}
}

async function sendJsonDev(url: string, method: SendJsonMethod, body: unknown): Promise<SendJsonResult> {
	console.log(`[DEV] ${method} json`, url);
	const hasBody = sendJsonHasBody(method, body);
	const res = await fetch(url, {
		method,
		headers: sendJsonDevHeaders(hasBody),
		body: sendJsonDevBody(hasBody, body),
	});

	if (!res.ok) return sendJsonResponseToResult(res);
	return parseSendJsonDevResponse(res);
}

async function sendJsonViaTab(
	url: string,
	method: SendJsonMethod,
	body: unknown,
	credentials: CredentialsOption,
	auth: AuthOption,
): Promise<SendJsonResult> {
	const request = await buildMagisterTabJsonRequest({ method, url, credentials, auth, body });
	if (isScriptError(request)) return request;
	return executeInActiveMagisterTab(magisterTabJsonInPage, [request]);
}

async function sendJson(
	url: string,
	method: SendJsonMethod,
	body: unknown,
	credentials: CredentialsOption,
	auth: AuthOption,
): Promise<SendJsonResult> {
	try {
		if (import.meta.env.DEV) return sendJsonDev(url, method, body);
		return sendJsonViaTab(url, method, body, credentials, auth);
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ScriptError = { ok: false; error: string };

function schoolSessionTabIdFromUrl(id: number, url: string | undefined): number | undefined {
	if (!url) return undefined;
	if (!isSchoolSessionUrl(url)) return undefined;
	return id;
}

function schoolSessionTabId(tab: chrome.tabs.Tab): number | undefined {
	if (tab.id === undefined) return undefined;
	return schoolSessionTabIdFromUrl(tab.id, tab.url);
}

async function tabIdIfSchoolSession(storedId: number): Promise<number | undefined> {
	try {
		const tab = await chrome.tabs.get(storedId);
		return schoolSessionTabId(tab);
	} catch {
		return undefined;
	}
}

async function resolveStoredMagisterTabId(): Promise<number | undefined> {
	const storedId = Number((await chrome.storage.session.get('activeTabId')).activeTabId);
	if (Number.isNaN(storedId)) return undefined;
	return tabIdIfSchoolSession(storedId);
}

async function rememberAndReturnTabId(tab: chrome.tabs.Tab): Promise<number | undefined> {
	if (tab.id === undefined) return undefined;
	await chrome.storage.session.set({ activeTabId: tab.id });
	return tab.id;
}

async function resolveActiveMagisterTabId(): Promise<number | undefined> {
	const fromStorage = await resolveStoredMagisterTabId();
	if (fromStorage !== undefined) return fromStorage;

	const tab = await findSchoolSessionTab();
	if (!tab) return undefined;
	return rememberAndReturnTabId(tab);
}

function scriptResultOrUnknown<T>(result: unknown): T | ScriptError {
	if (result === undefined) return { ok: false, error: 'unknown' };
	if (result === null) return { ok: false, error: 'unknown' };
	return result as T;
}

async function executeScriptInTab<T, Args extends unknown[]>(
	tabId: number,
	func: (...args: Args) => Promise<T>,
	args: Args,
): Promise<T | ScriptError> {
	try {
		const [injection] = await chrome.scripting.executeScript({
			target: { tabId },
			world: 'MAIN',
			func,
			args,
		});
		return scriptResultOrUnknown<T>(injection.result);
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}

async function readOidcAccessTokenFromActiveTab(): Promise<string | ScriptError> {
	return executeInActiveMagisterTab(readOidcAccessTokenInPage, []);
}

async function buildMagisterTabJsonRequest(input: {
	method: MagisterTabJsonMethod;
	url: string;
	credentials: CredentialsOption;
	auth: AuthOption;
	body: unknown | null;
}): Promise<MagisterTabJsonRequest | ScriptError> {
	let accessToken = '';
	if (input.auth === 'bearer') {
		const token = await readOidcAccessTokenFromActiveTab();
		if (typeof token !== 'string') return token;
		accessToken = token;
	}

	return {
		method: input.method,
		url: input.url,
		credentials: input.credentials,
		auth: input.auth,
		accessToken,
		body: input.body,
		sessionExpiredMessage: MAGISTER_SESSION_EXPIRED_MESSAGE,
		tokenMissingMessage: MAGISTER_TOKEN_MISSING_MESSAGE,
	};
}

const TAB_UNAVAILABLE: ScriptError = {
	ok: false,
	error: MAGISTER_TAB_UNAVAILABLE_MESSAGE,
};

/** Chrome errors when the tab closed, reloaded, or navigated off Magister between lookup and injection. */
const TAB_GONE_ERROR_PARTS = ['No tab with id', 'Frame with ID', 'Cannot access contents of'];

/** A school 404 also maps to the expired message; the background re-check makes that harmless. */
function maybeRequestSessionVerification<T>(result: T | ScriptError): void {
	if (!isScriptError(result)) return;
	if (!isMagisterUnavailableError(result.error)) return;
	requestMagisterSessionVerification();
}

async function executeInActiveMagisterTab<T, Args extends unknown[]>(
	func: (...args: Args) => Promise<T>,
	args: Args,
): Promise<T | ScriptError> {
	const result = await executeWithTabRetry(func, args);
	maybeRequestSessionVerification(result);
	return result;
}

async function retryScriptAfterTabGone<T, Args extends unknown[]>(
	func: (...args: Args) => Promise<T>,
	args: Args,
): Promise<T | ScriptError> {
	await chrome.storage.session.remove('activeTabId');
	const retryId = await resolveActiveMagisterTabId();
	if (retryId === undefined) return TAB_UNAVAILABLE;
	const retry = await executeScriptInTab(retryId, func, args);
	if (isTabGoneError(retry)) return TAB_UNAVAILABLE;
	return retry;
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
	return retryScriptAfterTabGone(func, args);
}

function isScriptErrorObject(result: object): result is ScriptError {
	if (!('ok' in result)) return false;
	return result.ok === false;
}

function isScriptError<T>(result: T | ScriptError): result is ScriptError {
	if (typeof result !== 'object') return false;
	if (result === null) return false;
	return isScriptErrorObject(result);
}

function isTabGoneError<T>(result: T | ScriptError): result is ScriptError {
	if (!isScriptError(result)) return false;
	return TAB_GONE_ERROR_PARTS.some((part) => result.error.includes(part));
}

await loadJsonCache();

function cachedJsonResult<T>(url: string, cache: CacheOption): FetchResult<T> | null {
	if (cache !== 'cache') return null;
	const cacheEntry = jsonCacheGet<T>(url);
	if (!cacheEntry) return null;
	console.log(`[JSON CACHE] ${url}`);
	return { ok: true, data: cacheEntry };
}

async function maybeWriteJsonCache<T>(url: string, cache: CacheOption, data: T): Promise<void> {
	if (cache === 'no-cache') return;
	await jsonCacheSet(url, data);
}

async function getJsonDev<T>(url: string, cache: CacheOption): Promise<FetchResult<T>> {
	console.log(`[DEV] fetch json`, url);
	const res = await fetch(url, {
		method: 'GET',
		headers: { Accept: 'application/json' },
	});

	if (!res.ok) return { ok: false, error: schoolApiHttpErrorMessage(res.status) };

	const data = (await res.json()) as T;
	await maybeWriteJsonCache(url, cache, data);
	return { ok: true, data };
}

async function getJsonViaTab<T>(
	url: string,
	credentials: CredentialsOption,
	cache: CacheOption,
	auth: AuthOption,
): Promise<FetchResult<T>> {
	const request = await buildMagisterTabJsonRequest({ method: 'GET', url, credentials, auth, body: null });
	if (isScriptError(request)) return request;
	const result = await executeInActiveMagisterTab(magisterTabJsonInPage, [request]);

	if (!result.ok) return result;
	await maybeWriteJsonCache(url, cache, result.data as T);
	return { ok: true, data: result.data as T };
}

async function fetchJsonUncached<T>(
	url: string,
	credentials: CredentialsOption,
	cache: CacheOption,
	auth: AuthOption,
): Promise<FetchResult<T>> {
	if (import.meta.env.DEV) return getJsonDev(url, cache);
	return getJsonViaTab(url, credentials, cache, auth);
}

async function getJsonImpl<T>(
	url: string,
	credentials: CredentialsOption,
	cache: CacheOption,
	auth: AuthOption,
): Promise<FetchResult<T>> {
	const cached = cachedJsonResult<T>(url, cache);
	if (cached) return cached;

	try {
		return await fetchJsonUncached(url, credentials, cache, auth);
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}

async function getBlobDev(url: string): Promise<FetchBlobResult> {
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

async function getBlobImpl(url: string): Promise<FetchBlobResult> {
	try {
		if (import.meta.env.DEV) return getBlobDev(url);
		return executeInActiveMagisterTab(fetchBlobInMagisterTab, [url, MAGISTER_SESSION_EXPIRED_MESSAGE]);
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}
