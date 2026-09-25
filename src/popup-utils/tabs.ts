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

export async function openMagisterLoginTab(): Promise<chrome.tabs.Tab> {
	const remembered = await getRememberedLoginTab();
	if (remembered) return remembered;

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

export function waitForSchoolSessionTab(): Promise<chrome.tabs.Tab> {
	return new Promise((resolve, reject) => {
		let settled = false;
		let pollTimer: ReturnType<typeof setInterval> | undefined;
		let candidateTabId: number | undefined;

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

		const probeCompleteSchoolTab = async (tab: chrome.tabs.Tab | undefined) => {
			if (settled || tab?.id === undefined) return;
			if (tab.url && isSchoolSessionUrl(tab.url)) {
				await saveLoginTabId(tab.id);
				candidateTabId = tab.id;
			}
			if (!isCompleteSchoolTab(tab)) return;
			if (await isSchoolSessionReady(tab.id)) finish(tab);
		};

		const onUpdated = (_tabId: number, _change: chrome.tabs.OnUpdatedInfo, tab: chrome.tabs.Tab) => {
			if (!tab.url || !isSchoolSessionUrl(tab.url)) return;
			void probeCompleteSchoolTab(tab);
		};

		const onRemoved = (tabId: number) => {
			if (candidateTabId === tabId) candidateTabId = undefined;
			void recoverAfterTabClosed(tabId).catch(fail);
		};

		const cleanup = () => {
			if (pollTimer !== undefined) clearInterval(pollTimer);
			chrome.tabs.onUpdated.removeListener(onUpdated);
			chrome.tabs.onRemoved.removeListener(onRemoved);
		};

		chrome.tabs.onUpdated.addListener(onUpdated);
		chrome.tabs.onRemoved.addListener(onRemoved);

		const poll = () => {
			void (async () => {
				if (settled) return;
				if (candidateTabId !== undefined) {
					try {
						await probeCompleteSchoolTab(await chrome.tabs.get(candidateTabId));
						return;
					} catch {
						candidateTabId = undefined;
					}
				}
				await probeCompleteSchoolTab(await findSchoolSessionTab());
			})();
		};

		pollTimer = setInterval(poll, SESSION_POLL_MS);
		poll();
	});
}

async function recoverAfterTabClosed(tabId: number) {
	const storedId = Number((await chrome.storage.session.get(LOGIN_TAB_ID_KEY))[LOGIN_TAB_ID_KEY]);
	if (storedId !== tabId) return;

	const schoolTab = await findSchoolSessionTab();
	if (schoolTab?.id !== undefined) {
		await saveLoginTabId(schoolTab.id);
		return;
	}

	await clearLoginTabId();
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
