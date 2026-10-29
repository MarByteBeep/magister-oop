import { applyActionBadgeText } from './lib/extension/actionBadge';
import { MAGISTER_SESSION_KEY, VERIFY_MAGISTER_SESSION_MESSAGE } from './lib/session/magisterSession';
import {
	clearLoginTabId,
	findReadySchoolSessionTab,
	focusTab,
	getRememberedLoginTab,
	isSchoolSessionUrl,
	openMagisterLoginTab,
	rememberSchoolOrigin,
	waitForSchoolSessionTab,
} from './popup-utils/tabs';

const POPUP_WINDOW_ID_KEY = 'popupWindowId';

chrome.runtime.onInstalled.addListener(() => {
	console.log('Chrome extension installed');
});

chrome.runtime.onMessage.addListener(handleRuntimeMessage);

void resumeConnectingSession();

let popupWindowId: number | undefined;
let connecting: Promise<void> | undefined;
let connectAbort: AbortController | undefined;
let verifying: Promise<void> | undefined;

chrome.action.onClicked.addListener(handleActionClicked);

function handleRuntimeMessage(
	message: { type?: string; text?: unknown },
	_sender: chrome.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
): boolean | undefined {
	if (message.type === VERIFY_MAGISTER_SESSION_MESSAGE) {
		void verifyMagisterSession();
		return undefined;
	}
	if (message.type !== 'syncActionBadge') return undefined;
	return syncActionBadge(message.text, sendResponse);
}

function badgeErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return String(error);
}

function syncActionBadge(textValue: unknown, sendResponse: (response?: unknown) => void): boolean {
	const text = typeof textValue === 'string' ? textValue : '';
	void applyActionBadgeText(text)
		.then(() => sendResponse({ ok: true }))
		.catch((error: unknown) => {
			sendResponse({ ok: false, error: badgeErrorMessage(error) });
		});
	return true;
}

function hasTabId(tab: chrome.tabs.Tab | undefined): tab is chrome.tabs.Tab & { id: number } {
	if (!tab) return false;
	return tab.id !== undefined;
}

async function handleActionClicked() {
	await ensurePopupVisible();

	const readyTab = await findReadySchoolSessionTab();
	if (hasTabId(readyTab)) {
		await markSessionReady(readyTab);
		abortCurrentConnect();
		return;
	}

	await focusRememberedLoginSurface();
	await startConnecting();
}

function abortCurrentConnect() {
	connectAbort?.abort();
}

async function focusRememberedLoginSurface() {
	const loginTab = await getRememberedLoginTab();
	if (!loginTab) return;
	if (!isLoginSurfaceTab(loginTab)) return;
	await focusTab(loginTab);
}

function isLoginSurfaceTab(tab: chrome.tabs.Tab) {
	if (!tab.url) return true;
	return !isSchoolSessionUrl(tab.url);
}

function isAbortError(error: unknown) {
	return error instanceof DOMException && error.name === 'AbortError';
}

async function ensurePopupVisible() {
	const openPopupId = await getOpenPopupWindowId();
	if (openPopupId !== undefined) {
		await chrome.windows.update(openPopupId, { focused: true });
		return;
	}
	await markSessionUnverified();
	await createPopupWindow();
}

/** A new popup must not show cached student data before the session is re-checked. */
async function markSessionUnverified() {
	const stored = await chrome.storage.session.get(MAGISTER_SESSION_KEY);
	if (stored[MAGISTER_SESSION_KEY] !== 'ready') return;
	await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'checking' });
}

function verifyMagisterSession(): Promise<void> {
	verifying ??= recheckReadySession().finally(() => {
		verifying = undefined;
	});
	return verifying;
}

/** Leaves `ready` as soon as Magister drops the session, and brings the login tab to the front. */
async function recheckReadySession() {
	const stored = await chrome.storage.session.get(MAGISTER_SESSION_KEY);
	if (stored[MAGISTER_SESSION_KEY] !== 'ready') return;

	const readyTab = await findReadySchoolSessionTab();
	if (hasTabId(readyTab)) {
		await markSessionReady(readyTab);
		return;
	}

	await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'connecting' });
	void startConnecting();
}

async function startConnecting() {
	abortCurrentConnect();
	connectAbort = new AbortController();
	const { signal } = connectAbort;
	const run = connectMagisterSession(signal);
	connecting = run;
	await settleConnectingRun(run, signal);
}

async function settleConnectingRun(run: Promise<void>, signal: AbortSignal) {
	try {
		await run;
	} finally {
		clearConnectingIfCurrent(run);
		clearAbortIfCurrent(signal);
	}
}

function clearConnectingIfCurrent(run: Promise<void>) {
	if (connecting !== run) return;
	connecting = undefined;
}

function clearAbortIfCurrent(signal: AbortSignal) {
	if (!isConnectOwner(signal)) return;
	connectAbort = undefined;
}

async function resumeConnectingSession() {
	const stored = await chrome.storage.session.get(MAGISTER_SESSION_KEY);
	if (stored[MAGISTER_SESSION_KEY] !== 'connecting') return;
	if (connecting) return;
	await startConnecting();
}

function isConnectOwner(signal: AbortSignal): boolean {
	return connectAbort?.signal === signal;
}

async function markSessionCancelledIfOwner(signal: AbortSignal) {
	if (!isConnectOwner(signal)) return;
	await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'cancelled' });
}

async function completeConnectWithTab(schoolTab: chrome.tabs.Tab | undefined, signal: AbortSignal) {
	if (signal.aborted) throw new DOMException('Magister login aborted', 'AbortError');
	if (!hasTabId(schoolTab)) {
		await markSessionCancelledIfOwner(signal);
		return;
	}
	await markSessionReady(schoolTab);
}

async function handleConnectAbort() {
	const stored = await chrome.storage.session.get(MAGISTER_SESSION_KEY);
	if (stored[MAGISTER_SESSION_KEY] === 'ready') return;
	await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'cancelled' });
}

function shouldTreatAsAbort(err: unknown, signal: AbortSignal): boolean {
	if (isAbortError(err)) return true;
	return signal.aborted;
}

async function handleConnectFailure(err: unknown, signal: AbortSignal) {
	if (!isConnectOwner(signal)) return;
	if (shouldTreatAsAbort(err, signal)) {
		await handleConnectAbort();
		return;
	}
	console.log('Magister login cancelled', err);
	await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'cancelled' });
}

async function resolveSchoolTab(signal: AbortSignal) {
	const readyTab = await findReadySchoolSessionTab();
	if (readyTab) return readyTab;
	return waitForLoginSession(signal);
}

async function clearLoginTabIfOwner(signal: AbortSignal) {
	if (!isConnectOwner(signal)) return;
	await clearLoginTabId();
}

async function connectMagisterSession(signal: AbortSignal) {
	try {
		await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'connecting' });
		const schoolTab = await resolveSchoolTab(signal);
		await completeConnectWithTab(schoolTab, signal);
	} catch (err) {
		await handleConnectFailure(err, signal);
	} finally {
		await clearLoginTabIfOwner(signal);
	}
}

async function waitForLoginSession(signal: AbortSignal) {
	const loginTab = await openMagisterLoginTab();
	if (loginTab.id !== undefined) {
		await focusTab(loginTab);
	}
	return waitForSchoolSessionTab(signal);
}

async function markSessionReady(schoolTab: chrome.tabs.Tab) {
	await rememberSchoolOrigin(schoolTab);
	await chrome.storage.session.set({
		activeTabId: schoolTab.id,
		[MAGISTER_SESSION_KEY]: 'ready',
	});
}

async function getPopupIdFromMemory(): Promise<number | undefined> {
	if (popupWindowId === undefined) return undefined;
	try {
		await chrome.windows.get(popupWindowId);
		return popupWindowId;
	} catch {
		popupWindowId = undefined;
		return undefined;
	}
}

async function getPopupIdFromStorage(): Promise<number | undefined> {
	const stored = Number((await chrome.storage.session.get(POPUP_WINDOW_ID_KEY))[POPUP_WINDOW_ID_KEY]);
	if (Number.isNaN(stored)) return undefined;
	return readStoredPopupWindow(stored);
}

async function readStoredPopupWindow(stored: number): Promise<number | undefined> {
	try {
		await chrome.windows.get(stored);
		popupWindowId = stored;
		return stored;
	} catch {
		await chrome.storage.session.remove(POPUP_WINDOW_ID_KEY);
		return undefined;
	}
}

async function getOpenPopupWindowId(): Promise<number | undefined> {
	const fromMemory = await getPopupIdFromMemory();
	if (fromMemory !== undefined) return fromMemory;
	return getPopupIdFromStorage();
}

function onPopupWindowRemoved(windowId: number) {
	if (windowId !== popupWindowId) return;
	popupWindowId = undefined;
	void chrome.storage.session.remove(POPUP_WINDOW_ID_KEY);
	chrome.windows.onRemoved.removeListener(onPopupWindowRemoved);
	// Drop a hanging login wait so the next toolbar click can open a fresh popup.
	abortCurrentConnect();
}

function assignCreatedPopupWindow(win: chrome.windows.Window | undefined): void {
	if (!win?.id) throw new Error('Failed to create popup window');
	popupWindowId = win.id;
	void chrome.storage.session.set({ [POPUP_WINDOW_ID_KEY]: win.id });
	chrome.windows.onRemoved.addListener(onPopupWindowRemoved);
}

function createPopupWindow(): Promise<void> {
	return new Promise((resolve, reject) => {
		chrome.windows.create(
			{
				url: chrome.runtime.getURL('index.html'),
				type: 'popup',
				width: 1300,
				height: 900,
				left: 100,
				top: 100,
			},
			(win) => {
				try {
					assignCreatedPopupWindow(win);
					resolve();
				} catch (error) {
					reject(error);
				}
			},
		);
	});
}
