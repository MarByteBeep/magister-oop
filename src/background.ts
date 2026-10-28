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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type === VERIFY_MAGISTER_SESSION_MESSAGE) {
		void verifyMagisterSession();
		return undefined;
	}
	if (message.type !== 'syncActionBadge') return undefined;

	const text = typeof message.text === 'string' ? message.text : '';
	void applyActionBadgeText(text)
		.then(() => sendResponse({ ok: true }))
		.catch((error: unknown) => {
			sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
		});
	return true;
});

void resumeConnectingSession();

let popupWindowId: number | undefined;
let connecting: Promise<void> | undefined;
let connectAbort: AbortController | undefined;
let verifying: Promise<void> | undefined;

chrome.action.onClicked.addListener(async () => {
	// Always surface the popup first — never no-op while a prior connect is hanging.
	await ensurePopupVisible();

	const readyTab = await findReadySchoolSessionTab();
	if (readyTab?.id) {
		// Mark ready before aborting so a racing AbortError cannot overwrite status with cancelled.
		await markSessionReady(readyTab);
		connectAbort?.abort();
		return;
	}

	// Only steal focus for a real login surface (e.g. accounts), never an expired school SPA.
	const loginTab = await getRememberedLoginTab();
	if (loginTab && isLoginSurfaceTab(loginTab)) {
		await focusTab(loginTab);
	}

	// Abort + restart — do not skip while `connecting` is still settling after an abort.
	await startConnecting();
});

function isLoginSurfaceTab(tab: chrome.tabs.Tab) {
	return !tab.url || !isSchoolSessionUrl(tab.url);
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
	if (readyTab?.id) {
		await markSessionReady(readyTab);
		return;
	}

	await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'connecting' });
	void startConnecting();
}

async function startConnecting() {
	connectAbort?.abort();
	connectAbort = new AbortController();
	const { signal } = connectAbort;

	const run = connectMagisterSession(signal);
	connecting = run;
	try {
		await run;
	} finally {
		if (connecting === run) connecting = undefined;
		if (connectAbort?.signal === signal) connectAbort = undefined;
	}
}

async function resumeConnectingSession() {
	const stored = await chrome.storage.session.get(MAGISTER_SESSION_KEY);
	if (stored[MAGISTER_SESSION_KEY] !== 'connecting' || connecting) return;

	await startConnecting();
}

async function connectMagisterSession(signal: AbortSignal) {
	const isOwner = () => connectAbort?.signal === signal;
	try {
		await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'connecting' });
		const readyTab = await findReadySchoolSessionTab();
		const schoolTab = readyTab ?? (await waitForLoginSession(signal));
		if (signal.aborted) throw new DOMException('Magister login aborted', 'AbortError');
		if (!schoolTab?.id) {
			if (isOwner()) await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'cancelled' });
			return;
		}
		await markSessionReady(schoolTab);
	} catch (err) {
		// Superseded by a newer connect — leave status and login tab alone.
		if (!isOwner()) return;
		if (isAbortError(err) || signal.aborted) {
			const stored = await chrome.storage.session.get(MAGISTER_SESSION_KEY);
			if (stored[MAGISTER_SESSION_KEY] === 'ready') return;
			await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'cancelled' });
			return;
		}
		console.log('Magister login cancelled', err);
		await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'cancelled' });
	} finally {
		if (isOwner()) await clearLoginTabId();
	}
}

async function waitForLoginSession(signal: AbortSignal) {
	// Let openMagisterLoginTab skip expired school SPAs and reuse accounts tabs.
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

async function getOpenPopupWindowId(): Promise<number | undefined> {
	if (popupWindowId !== undefined) {
		try {
			await chrome.windows.get(popupWindowId);
			return popupWindowId;
		} catch {
			popupWindowId = undefined;
		}
	}

	const stored = Number((await chrome.storage.session.get(POPUP_WINDOW_ID_KEY))[POPUP_WINDOW_ID_KEY]);
	if (Number.isNaN(stored)) return undefined;

	try {
		await chrome.windows.get(stored);
		popupWindowId = stored;
		return stored;
	} catch {
		await chrome.storage.session.remove(POPUP_WINDOW_ID_KEY);
		return undefined;
	}
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
				if (!win?.id) {
					reject(new Error('Failed to create popup window'));
					return;
				}

				popupWindowId = win.id;
				void chrome.storage.session.set({ [POPUP_WINDOW_ID_KEY]: win.id });

				const onRemoved = (windowId: number) => {
					if (windowId === popupWindowId) {
						popupWindowId = undefined;
						void chrome.storage.session.remove(POPUP_WINDOW_ID_KEY);
						chrome.windows.onRemoved.removeListener(onRemoved);
						// Drop a hanging login wait so the next toolbar click can open a fresh popup.
						connectAbort?.abort();
					}
				};
				chrome.windows.onRemoved.addListener(onRemoved);
				resolve();
			},
		);
	});
}
