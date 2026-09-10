import { MAGISTER_SESSION_KEY } from './lib/magisterSession';
import {
	clearLoginTabId,
	findReadySchoolSessionTab,
	findSchoolSessionTab,
	focusTab,
	getRememberedLoginTab,
	openMagisterLoginTab,
	rememberSchoolOrigin,
	saveLoginTabId,
	waitForSchoolSessionTab,
} from './popup-utils/tabs';

const POPUP_WINDOW_ID_KEY = 'popupWindowId';

const DEFAULT_ICONS = {
	16: 'icons/icon16.png',
	32: 'icons/icon32.png',
	48: 'icons/icon48.png',
	128: 'icons/icon128.png',
};

chrome.runtime.onInstalled.addListener(() => {
	console.log('Chrome extension installed');
});

void resetToolbarAction();
void resumeConnectingSession();

/** Re-enable the toolbar action and restore the default icon on every open tab. */
async function resetToolbarAction() {
	await chrome.action.setIcon({ path: DEFAULT_ICONS });
	await chrome.action.enable();

	const tabs = await chrome.tabs.query({});
	await Promise.all(
		tabs.flatMap((tab) => {
			if (tab.id === undefined) return [];
			return [chrome.action.enable(tab.id), chrome.action.setIcon({ tabId: tab.id, path: DEFAULT_ICONS })];
		}),
	);
}

let popupWindowId: number | undefined;
let connecting: Promise<void> | undefined;

chrome.action.onClicked.addListener(async () => {
	const openPopupId = await getOpenPopupWindowId();
	if (openPopupId !== undefined) {
		const loginTab = await getRememberedLoginTab();
		if (loginTab) {
			await focusTab(loginTab);
			return;
		}

		chrome.windows.update(openPopupId, { focused: true });

		const stored = await chrome.storage.session.get(MAGISTER_SESSION_KEY);
		if (stored[MAGISTER_SESSION_KEY] === 'ready' || connecting) return;

		connecting = connectMagisterSession();
		try {
			await connecting;
		} finally {
			connecting = undefined;
		}
		return;
	}

	if (connecting) {
		await connecting;
		return;
	}

	connecting = openExtension();
	try {
		await connecting;
	} finally {
		connecting = undefined;
	}
});

async function openExtension() {
	const readyTab = await findReadySchoolSessionTab();
	if (readyTab?.id) {
		await markSessionReady(readyTab);
		await createPopupWindow();
		return;
	}

	await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'connecting' });
	await createPopupWindow();
	await connectMagisterSession();
}

async function resumeConnectingSession() {
	const stored = await chrome.storage.session.get(MAGISTER_SESSION_KEY);
	if (stored[MAGISTER_SESSION_KEY] !== 'connecting' || connecting) return;

	connecting = connectMagisterSession();
	try {
		await connecting;
	} finally {
		connecting = undefined;
	}
}

async function connectMagisterSession() {
	try {
		const readyTab = await findReadySchoolSessionTab();
		const schoolTab = readyTab ?? (await waitForLoginSession());
		if (!schoolTab?.id) {
			await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'cancelled' });
			return;
		}
		await markSessionReady(schoolTab);
	} catch (err) {
		console.log('Magister login cancelled', err);
		await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'cancelled' });
	} finally {
		await clearLoginTabId();
	}
}

async function waitForLoginSession() {
	const loginTab = (await findSchoolSessionTab()) ?? (await openMagisterLoginTab());
	if (loginTab.id !== undefined) {
		await saveLoginTabId(loginTab.id);
	}
	await chrome.storage.session.set({ [MAGISTER_SESSION_KEY]: 'connecting' });
	return waitForSchoolSessionTab();
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
					}
				};
				chrome.windows.onRemoved.addListener(onRemoved);
				resolve();
			},
		);
	});
}
