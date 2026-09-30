/** Hosts that are Magister, but not a signed-in school session. */
const BLOCKED_MAGISTER_HOSTS = new Set([
	'accounts.magister.net',
	'www.magister.net',
	'attendance.magister.net',
	'lockers.magister.net',
]);

const MAGISTER_TAB_QUERY = { url: ['*://*.magister.net/*'] } satisfies chrome.tabs.QueryInfo;

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

export async function findSchoolSessionTab(): Promise<chrome.tabs.Tab | undefined> {
	const tabs = await chrome.tabs.query(MAGISTER_TAB_QUERY);
	const schoolTabs = tabs.filter((tab) => tab.url && isSchoolSessionUrl(tab.url));
	schoolTabs.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
	return schoolTabs[0];
}

export function isCompleteSchoolTab(tab: Pick<chrome.tabs.Tab, 'url' | 'status'>) {
	return tab.status === 'complete' && Boolean(tab.url && isSchoolSessionUrl(tab.url));
}

/** Runs in the Magister tab (MAIN world). Must be self-contained for script injection. */
export async function checkSchoolSessionReadyInPage(): Promise<boolean> {
	// Nested copy required: injected functions cannot import module helpers.
	// fallow-ignore-next-line code-duplication
	function parseOidcAccessToken(stored: string): string {
		try {
			return (JSON.parse(stored) as { access_token?: string }).access_token ?? '';
		} catch {
			return '';
		}
	}

	function readOidcTokenFromStorage(storage: Storage): string {
		for (let index = 0; index < storage.length; index++) {
			const key = storage.key(index);
			if (!key?.startsWith('oidc.user:')) continue;
			const stored = storage.getItem(key);
			if (!stored) continue;
			const token = parseOidcAccessToken(stored);
			if (token) return token;
		}
		return '';
	}

	function hasOidcToken(): boolean {
		return Boolean(
			readOidcTokenFromStorage(window.sessionStorage) || readOidcTokenFromStorage(window.localStorage),
		);
	}

	if (!hasOidcToken()) return false;

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

/** True when the school SPA has an OIDC token and session cookies. */
export async function isSchoolSessionReady(tabId: number): Promise<boolean> {
	try {
		const tab = await chrome.tabs.get(tabId);
		if (!isCompleteSchoolTab(tab)) return false;

		const [injection] = await chrome.scripting.executeScript({
			target: { tabId },
			world: 'MAIN',
			func: checkSchoolSessionReadyInPage,
		});

		return injection?.result === true;
	} catch {
		return false;
	}
}

export async function findReadySchoolSessionTab(): Promise<chrome.tabs.Tab | undefined> {
	const tabs = await chrome.tabs.query(MAGISTER_TAB_QUERY);
	const schoolTabs = tabs.filter((tab) => tab.url && isSchoolSessionUrl(tab.url));
	schoolTabs.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));

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

export async function openMagisterLoginTab(): Promise<chrome.tabs.Tab> {
	const remembered = await getRememberedLoginTab();
	if (remembered?.id !== undefined) {
		// Reuse accounts (or other non-school) tabs. Skip school SPA tabs that are no longer signed in —
		// latching onto those makes login wait forever after session expiry.
		if (!remembered.url || !isSchoolSessionUrl(remembered.url)) return remembered;
		if (await isSchoolSessionReady(remembered.id)) return remembered;
		await clearLoginTabId();
	}

	const tabs = await chrome.tabs.query(MAGISTER_TAB_QUERY);
	const accountsTab = tabs.find((tab) => hostnameOf(tab.url) === 'accounts.magister.net');
	if (accountsTab) {
		await saveLoginTabIfPresent(accountsTab);
		return accountsTab;
	}

	const stored = await chrome.storage.local.get(SCHOOL_ORIGIN_KEY);
	const origin = stored[SCHOOL_ORIGIN_KEY];
	const url = typeof origin === 'string' && origin.length > 0 ? origin : DEFAULT_LOGIN_URL;
	const created = await chrome.tabs.create({ url, active: true });
	await saveLoginTabIfPresent(created);
	return created;
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
	await chrome.storage.local.set({ [SCHOOL_ORIGIN_KEY]: new URL(tab.url).origin });
}

const SESSION_POLL_MS = 2000;
const RECOVER_SUCCESSOR_WAIT_MS = 100;

export function waitForSchoolSessionTab(signal?: AbortSignal): Promise<chrome.tabs.Tab> {
	return new Promise((resolve, reject) => {
		let settled = false;
		let pollTimer: ReturnType<typeof setInterval> | undefined;
		/** School SPA opened/navigated during this wait (may still be loading). */
		let successorTabId: number | undefined;
		let preexistingSchoolTabIds = new Set<number>();
		let rememberedLoginTabId: number | undefined;

		const finish = (tab: chrome.tabs.Tab) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve(tab);
		};

		const fail = (error: Error) => {
			if (settled) return;
			settled = true;
			cleanup();
			reject(error);
		};

		const onAbort = () => fail(new DOMException('Magister login aborted', 'AbortError'));
		const isSettled = () => settled;

		const isAdoptableSchoolTab = (tab: chrome.tabs.Tab) => {
			if (tab.id === undefined || !tab.url || !isSchoolSessionUrl(tab.url)) return false;
			return isLoginSuccessorTabId(tab.id, preexistingSchoolTabIds, rememberedLoginTabId);
		};

		const probeSuccessorReady = async (tab: chrome.tabs.Tab | undefined) => {
			if (settled || tab?.id === undefined) return;
			if (!isCompleteSchoolTab(tab)) return;
			if (await isSchoolSessionReady(tab.id)) {
				await saveLoginTabId(tab.id);
				finish(tab);
			}
		};

		/** Adopt a school SPA opened/navigated during this login — even while still loading. */
		const adoptSuccessor = async (tab: chrome.tabs.Tab) => {
			if (settled || tab.id === undefined || !isAdoptableSchoolTab(tab)) return;
			successorTabId = tab.id;
			await saveLoginTabId(tab.id);
			await probeSuccessorReady(tab);
		};

		const onUpdated = (_tabId: number, _change: chrome.tabs.OnUpdatedInfo, tab: chrome.tabs.Tab) => {
			void adoptSuccessor(tab);
		};

		const onRemoved = (tabId: number) => {
			if (successorTabId === tabId) successorTabId = undefined;
			void recoverAfterTabClosed(tabId, () => successorTabId, isSettled).catch(fail);
		};

		const cleanup = () => {
			if (pollTimer !== undefined) clearInterval(pollTimer);
			chrome.tabs.onUpdated.removeListener(onUpdated);
			chrome.tabs.onRemoved.removeListener(onRemoved);
			signal?.removeEventListener('abort', onAbort);
		};

		const poll = () => {
			void (async () => {
				if (settled) return;
				if (successorTabId !== undefined) {
					try {
						await probeSuccessorReady(await chrome.tabs.get(successorTabId));
						if (settled) return;
					} catch {
						successorTabId = undefined;
					}
				}

				const tabs = await chrome.tabs.query(MAGISTER_TAB_QUERY);
				for (const tab of tabs) {
					if (settled) return;
					if (tab.id !== successorTabId) await adoptSuccessor(tab);
				}

				if (settled) return;
				// Pre-existing expired SPA became ready (user signed in on that tab).
				const readyTab = await findReadySchoolSessionTab();
				if (readyTab?.id !== undefined) {
					await saveLoginTabId(readyTab.id);
					finish(readyTab);
				}
			})();
		};

		const begin = async () => {
			if (signal?.aborted) {
				onAbort();
				return;
			}

			preexistingSchoolTabIds = await schoolSessionTabIds();
			rememberedLoginTabId = (await getRememberedLoginTab())?.id;
			if (settled) return;
			if (signal?.aborted) {
				onAbort();
				return;
			}

			if (signal) signal.addEventListener('abort', onAbort, { once: true });
			chrome.tabs.onUpdated.addListener(onUpdated);
			chrome.tabs.onRemoved.addListener(onRemoved);
			pollTimer = setInterval(poll, SESSION_POLL_MS);
			poll();
		};

		void begin().catch(fail);
	});
}

async function recoverAfterTabClosed(
	tabId: number,
	getSuccessorId: () => number | undefined,
	isSettled: () => boolean,
) {
	const storedId = Number((await chrome.storage.session.get(LOGIN_TAB_ID_KEY))[LOGIN_TAB_ID_KEY]);
	if (storedId !== tabId) return;

	// Magister often opens the school SPA before closing accounts — let onUpdated land first.
	await new Promise<void>((resolve) => setTimeout(resolve, RECOVER_SUCCESSOR_WAIT_MS));
	if (isSettled()) return;

	const successorId = getSuccessorId();
	if (successorId !== undefined && successorId !== tabId) {
		try {
			const successor = await chrome.tabs.get(successorId);
			if (successor.url && isSchoolSessionUrl(successor.url)) {
				await saveLoginTabId(successorId);
				return;
			}
		} catch {
			// Successor gone; fall through.
		}
	}

	if (isSettled()) return;

	// Only latch onto a school SPA that is actually signed in — an expired SPA hangs forever.
	const readyTab = await findReadySchoolSessionTab();
	if (readyTab?.id !== undefined) {
		await saveLoginTabId(readyTab.id);
		return;
	}

	if (isSettled()) return;
	await clearLoginTabId();
	if (isSettled()) return;
	const next = await openMagisterLoginTab();
	if (next.id === undefined) throw new Error('Magister login tab was closed');
}

function hostnameOf(urlString: string | undefined) {
	if (!urlString) return undefined;
	try {
		return new URL(urlString).hostname.toLowerCase();
	} catch {
		return undefined;
	}
}
