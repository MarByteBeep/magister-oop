import { readOidcAccessTokenInPage } from '@/magister/oidcAccessTokenInPage';

/** Hosts that are Magister, but not a signed-in school session. */
const BLOCKED_MAGISTER_HOSTS = new Set([
	'accounts.magister.net',
	'www.magister.net',
	'attendance.magister.net',
	'lockers.magister.net',
]);

const MAGISTER_TAB_QUERY = {
	url: ['*://*.magister.net/*'],
} satisfies chrome.tabs.QueryInfo;

const DEFAULT_LOGIN_URL = 'https://accounts.magister.net';
const SCHOOL_ORIGIN_KEY = 'magisterSchoolOrigin';
const LOGIN_TAB_ID_KEY = 'loginTabId';

const SCHOOL_HOST_PATTERN = /^[a-z0-9-]+\.magister\.net$/i;

/** School SPA (`{school}.magister.net`), where session cookies and the OIDC token live. */
export function isSchoolSessionUrl(urlString: string) {
	try {
		const hostname = new URL(urlString).hostname.toLowerCase();
		if (!SCHOOL_HOST_PATTERN.test(hostname)) return false;
		return !BLOCKED_MAGISTER_HOSTS.has(hostname);
	} catch {
		return false;
	}
}

function sortTabsByLastAccessed(tabs: chrome.tabs.Tab[]): chrome.tabs.Tab[] {
	return [...tabs].sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
}

async function querySchoolSessionTabs(): Promise<chrome.tabs.Tab[]> {
	const tabs = await chrome.tabs.query(MAGISTER_TAB_QUERY);
	return tabs.filter((tab) => tab.url && isSchoolSessionUrl(tab.url));
}

export async function findSchoolSessionTab(): Promise<chrome.tabs.Tab | undefined> {
	const schoolTabs = sortTabsByLastAccessed(await querySchoolSessionTabs());
	return schoolTabs[0];
}

export function isCompleteSchoolTab(tab: Pick<chrome.tabs.Tab, 'url' | 'status'>) {
	if (tab.status !== 'complete') return false;
	return Boolean(tab.url && isSchoolSessionUrl(tab.url));
}

/** Runs in the Magister tab (MAIN world). Cookie session check only — OIDC is read separately. */
export async function checkSchoolSessionReadyInPage(): Promise<boolean> {
	try {
		const res = await fetch('/api/account', {
			credentials: 'include',
			headers: { Accept: 'application/json' },
		});
		if (!res.ok) return false;
		await res.json();
		return true;
	} catch {
		return false;
	}
}

async function injectSchoolSessionChecks(tabId: number): Promise<boolean> {
	const [tokenInjection] = await chrome.scripting.executeScript({
		target: { tabId },
		world: 'MAIN',
		func: readOidcAccessTokenInPage,
	});
	if (!tokenInjection?.result) return false;

	const [injection] = await chrome.scripting.executeScript({
		target: { tabId },
		world: 'MAIN',
		func: checkSchoolSessionReadyInPage,
	});

	return injection?.result === true;
}

/** True when the school SPA has an OIDC token and session cookies. */
export async function isSchoolSessionReady(tabId: number): Promise<boolean> {
	try {
		const tab = await chrome.tabs.get(tabId);
		if (!isCompleteSchoolTab(tab)) return false;
		return await injectSchoolSessionChecks(tabId);
	} catch {
		return false;
	}
}

export async function findReadySchoolSessionTab(): Promise<chrome.tabs.Tab | undefined> {
	const schoolTabs = sortTabsByLastAccessed(await querySchoolSessionTabs());

	for (const tab of schoolTabs) {
		if (tab.id !== undefined && (await isSchoolSessionReady(tab.id))) return tab;
	}

	return undefined;
}

async function schoolSessionTabIds(): Promise<Set<number>> {
	const tabs = await chrome.tabs.query(MAGISTER_TAB_QUERY);
	return new Set(
		tabs.flatMap((tab) => (tab.id !== undefined && tab.url && isSchoolSessionUrl(tab.url) ? [tab.id] : [])),
	);
}

/** School SPA that belongs to this login wait — not a tab that was already open (likely expired). */
export function isLoginSuccessorTabId(
	tabId: number,
	preexistingSchoolTabIds: ReadonlySet<number>,
	rememberedLoginTabId: number | undefined,
): boolean {
	if (tabId === rememberedLoginTabId) return true;
	return !preexistingSchoolTabIds.has(tabId);
}

async function reuseRememberedLoginTab(remembered: chrome.tabs.Tab): Promise<chrome.tabs.Tab | undefined> {
	if (remembered.id === undefined) return undefined;
	// Reuse accounts (or other non-school) tabs. Skip school SPA tabs that are no longer signed in —
	// latching onto those makes login wait forever after session expiry.
	if (!remembered.url || !isSchoolSessionUrl(remembered.url)) return remembered;
	if (await isSchoolSessionReady(remembered.id)) return remembered;
	await clearLoginTabId();
	return undefined;
}

async function findAccountsMagisterTab(): Promise<chrome.tabs.Tab | undefined> {
	const tabs = await chrome.tabs.query(MAGISTER_TAB_QUERY);
	return tabs.find((tab) => hostnameOf(tab.url) === 'accounts.magister.net');
}

async function resolveLoginUrl(): Promise<string> {
	const stored = await chrome.storage.local.get(SCHOOL_ORIGIN_KEY);
	const origin = stored[SCHOOL_ORIGIN_KEY];
	if (typeof origin === 'string' && origin.length > 0) return origin;
	return DEFAULT_LOGIN_URL;
}

async function createAndRememberLoginTab(): Promise<chrome.tabs.Tab> {
	const created = await chrome.tabs.create({ url: await resolveLoginUrl(), active: true });
	await saveLoginTabIfPresent(created);
	return created;
}

export async function openMagisterLoginTab(): Promise<chrome.tabs.Tab> {
	const remembered = await getRememberedLoginTab();
	if (remembered) {
		const reused = await reuseRememberedLoginTab(remembered);
		if (reused) return reused;
	}

	const accountsTab = await findAccountsMagisterTab();
	if (accountsTab) {
		await saveLoginTabIfPresent(accountsTab);
		return accountsTab;
	}

	return createAndRememberLoginTab();
}

async function saveLoginTabIfPresent(tab: chrome.tabs.Tab) {
	if (tab.id !== undefined) {
		await saveLoginTabId(tab.id);
	}
}

export async function saveLoginTabId(tabId: number): Promise<void> {
	await chrome.storage.session.set({ [LOGIN_TAB_ID_KEY]: tabId });
}

export async function clearLoginTabId(): Promise<void> {
	await chrome.storage.session.remove(LOGIN_TAB_ID_KEY);
}

export async function getRememberedLoginTab(): Promise<chrome.tabs.Tab | undefined> {
	const tabId = Number((await chrome.storage.session.get(LOGIN_TAB_ID_KEY))[LOGIN_TAB_ID_KEY]);
	if (Number.isNaN(tabId)) return undefined;

	try {
		return await chrome.tabs.get(tabId);
	} catch {
		await clearLoginTabId();
		return undefined;
	}
}

export async function focusTab(tab: chrome.tabs.Tab): Promise<void> {
	if (tab.id !== undefined) {
		await chrome.tabs.update(tab.id, { active: true });
	}
	if (tab.windowId !== undefined) {
		await chrome.windows.update(tab.windowId, { focused: true });
	}
}

export async function rememberSchoolOrigin(tab: chrome.tabs.Tab): Promise<void> {
	if (!tab.url) return;
	await chrome.storage.local.set({
		[SCHOOL_ORIGIN_KEY]: new URL(tab.url).origin,
	});
}

const SESSION_POLL_MS = 2000;
const RECOVER_SUCCESSOR_WAIT_MS = 100;

type LoginWaitState = {
	settled: boolean;
	successorTabId: number | undefined;
	preexistingSchoolTabIds: Set<number>;
	rememberedLoginTabId: number | undefined;
};

function createLoginWaitHelpers(state: LoginWaitState, finish: (tab: chrome.tabs.Tab) => void) {
	const isSettled = () => state.settled;

	const isAdoptableSchoolTab = (tab: chrome.tabs.Tab) => {
		if (tab.id === undefined || !tab.url || !isSchoolSessionUrl(tab.url)) return false;
		return isLoginSuccessorTabId(tab.id, state.preexistingSchoolTabIds, state.rememberedLoginTabId);
	};

	const probeSuccessorReady = async (tab: chrome.tabs.Tab | undefined) => {
		if (state.settled || tab?.id === undefined) return;
		if (!isCompleteSchoolTab(tab)) return;
		if (await isSchoolSessionReady(tab.id)) {
			await saveLoginTabId(tab.id);
			finish(tab);
		}
	};

	/** Adopt a school SPA opened/navigated during this login — even while still loading. */
	const adoptSuccessor = async (tab: chrome.tabs.Tab) => {
		if (state.settled || tab.id === undefined || !isAdoptableSchoolTab(tab)) return;
		state.successorTabId = tab.id;
		await saveLoginTabId(tab.id);
		await probeSuccessorReady(tab);
	};

	return { isSettled, probeSuccessorReady, adoptSuccessor };
}

async function pollKnownSuccessor(
	state: LoginWaitState,
	probeSuccessorReady: (tab: chrome.tabs.Tab | undefined) => Promise<void>,
): Promise<void> {
	if (state.successorTabId === undefined) return;
	try {
		await probeSuccessorReady(await chrome.tabs.get(state.successorTabId));
	} catch {
		state.successorTabId = undefined;
	}
}

async function pollAdoptOpenTabs(
	state: LoginWaitState,
	adoptSuccessor: (tab: chrome.tabs.Tab) => Promise<void>,
): Promise<void> {
	const tabs = await chrome.tabs.query(MAGISTER_TAB_QUERY);
	for (const tab of tabs) {
		if (state.settled) return;
		if (tab.id !== state.successorTabId) await adoptSuccessor(tab);
	}
}

async function pollFinishIfReady(state: LoginWaitState, finish: (tab: chrome.tabs.Tab) => void): Promise<void> {
	if (state.settled) return;
	// Pre-existing expired SPA became ready (user signed in on that tab).
	const readyTab = await findReadySchoolSessionTab();
	if (readyTab?.id === undefined) return;
	await saveLoginTabId(readyTab.id);
	finish(readyTab);
}

async function runSessionPoll(
	state: LoginWaitState,
	probeSuccessorReady: (tab: chrome.tabs.Tab | undefined) => Promise<void>,
	adoptSuccessor: (tab: chrome.tabs.Tab) => Promise<void>,
	finish: (tab: chrome.tabs.Tab) => void,
): Promise<void> {
	if (state.settled) return;
	await pollKnownSuccessor(state, probeSuccessorReady);
	if (state.settled) return;
	await pollAdoptOpenTabs(state, adoptSuccessor);
	await pollFinishIfReady(state, finish);
}

function abortIfRequested(signal: AbortSignal | undefined, onAbort: () => void): boolean {
	if (!signal?.aborted) return false;
	onAbort();
	return true;
}

async function captureLoginWaitBaseline(state: LoginWaitState): Promise<void> {
	state.preexistingSchoolTabIds = await schoolSessionTabIds();
	state.rememberedLoginTabId = (await getRememberedLoginTab())?.id;
}

function attachAbortListener(signal: AbortSignal | undefined, onAbort: () => void): void {
	if (!signal) return;
	signal.addEventListener('abort', onAbort, { once: true });
}

async function beginLoginWait(
	signal: AbortSignal | undefined,
	state: LoginWaitState,
	onAbort: () => void,
	attachListeners: () => void,
	poll: () => void,
): Promise<void> {
	if (abortIfRequested(signal, onAbort)) return;

	await captureLoginWaitBaseline(state);
	if (state.settled) return;
	if (abortIfRequested(signal, onAbort)) return;

	attachAbortListener(signal, onAbort);
	attachListeners();
	poll();
}

export function waitForSchoolSessionTab(signal?: AbortSignal): Promise<chrome.tabs.Tab> {
	return new Promise((resolve, reject) => {
		let pollTimer: ReturnType<typeof setInterval> | undefined;
		const state: LoginWaitState = {
			settled: false,
			successorTabId: undefined,
			preexistingSchoolTabIds: new Set(),
			rememberedLoginTabId: undefined,
		};

		const cleanup = () => {
			if (pollTimer !== undefined) clearInterval(pollTimer);
			chrome.tabs.onUpdated.removeListener(onUpdated);
			chrome.tabs.onRemoved.removeListener(onRemoved);
			signal?.removeEventListener('abort', onAbort);
		};

		const finish = (tab: chrome.tabs.Tab) => {
			if (state.settled) return;
			state.settled = true;
			cleanup();
			resolve(tab);
		};

		const fail = (error: Error) => {
			if (state.settled) return;
			state.settled = true;
			cleanup();
			reject(error);
		};

		const onAbort = () => fail(new DOMException('Magister login aborted', 'AbortError'));
		const { isSettled, probeSuccessorReady, adoptSuccessor } = createLoginWaitHelpers(state, finish);

		const onUpdated = (_tabId: number, _change: chrome.tabs.OnUpdatedInfo, tab: chrome.tabs.Tab) => {
			void adoptSuccessor(tab);
		};

		const onRemoved = (tabId: number) => {
			if (state.successorTabId === tabId) state.successorTabId = undefined;
			void recoverAfterTabClosed(tabId, () => state.successorTabId, isSettled).catch(fail);
		};

		const poll = () => {
			void runSessionPoll(state, probeSuccessorReady, adoptSuccessor, finish);
		};

		const attachListeners = () => {
			chrome.tabs.onUpdated.addListener(onUpdated);
			chrome.tabs.onRemoved.addListener(onRemoved);
			pollTimer = setInterval(poll, SESSION_POLL_MS);
		};

		void beginLoginWait(signal, state, onAbort, attachListeners, poll).catch(fail);
	});
}

async function tryRememberSuccessorTab(successorId: number, closedTabId: number): Promise<boolean> {
	if (successorId === closedTabId) return false;
	try {
		const successor = await chrome.tabs.get(successorId);
		if (!successor.url || !isSchoolSessionUrl(successor.url)) return false;
		await saveLoginTabId(successorId);
		return true;
	} catch {
		return false;
	}
}

async function tryRememberReadySchoolTab(): Promise<boolean> {
	const readyTab = await findReadySchoolSessionTab();
	if (readyTab?.id === undefined) return false;
	await saveLoginTabId(readyTab.id);
	return true;
}

async function reopenLoginAfterClose(isSettled: () => boolean): Promise<void> {
	await clearLoginTabId();
	if (isSettled()) return;
	const next = await openMagisterLoginTab();
	if (next.id === undefined) throw new Error('Magister login tab was closed');
}

async function storedLoginTabMatches(tabId: number): Promise<boolean> {
	const storedId = Number((await chrome.storage.session.get(LOGIN_TAB_ID_KEY))[LOGIN_TAB_ID_KEY]);
	return storedId === tabId;
}

async function waitForSuccessorUpdate(): Promise<void> {
	// Magister often opens the school SPA before closing accounts — let onUpdated land first.
	await new Promise<void>((resolve) => setTimeout(resolve, RECOVER_SUCCESSOR_WAIT_MS));
}

async function adoptSuccessorAfterClose(tabId: number, getSuccessorId: () => number | undefined): Promise<boolean> {
	const successorId = getSuccessorId();
	if (successorId === undefined) return false;
	return tryRememberSuccessorTab(successorId, tabId);
}

async function recoverLoginSession(isSettled: () => boolean): Promise<void> {
	// Only latch onto a school SPA that is actually signed in — an expired SPA hangs forever.
	if (await tryRememberReadySchoolTab()) return;
	if (isSettled()) return;
	await reopenLoginAfterClose(isSettled);
}

async function recoverAfterTabClosed(
	tabId: number,
	getSuccessorId: () => number | undefined,
	isSettled: () => boolean,
) {
	if (!(await storedLoginTabMatches(tabId))) return;

	await waitForSuccessorUpdate();
	if (isSettled()) return;

	if (await adoptSuccessorAfterClose(tabId, getSuccessorId)) return;
	if (isSettled()) return;

	await recoverLoginSession(isSettled);
}

function hostnameOf(urlString: string | undefined) {
	if (!urlString) return undefined;
	try {
		return new URL(urlString).hostname.toLowerCase();
	} catch {
		return undefined;
	}
}
