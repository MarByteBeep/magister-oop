import { updateTab } from './popup-utils/tabs';

chrome.runtime.onInstalled.addListener(() => {
	console.log('Chrome extension installed');
});

/*
chrome.storage.onChanged.addListener((changes, areaName) => {
	if (areaName === 'session') {
		console.log('Session data changed:', changes);
	}
});
*/

let popupWindowId: number | undefined;

chrome.action.onClicked.addListener(async (tab) => {
	console.log('Extension icon clicked', tab, tab.id);

	if (popupWindowId) {
		// Focus existing window
		chrome.windows.update(popupWindowId, { focused: true });
		return;
	}

	// Only set this upon creation
	await chrome.storage.session.set({ activeTabId: tab.id });

	// Create new window
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
			if (!win) {
				console.error('Failed to create popup window');
				return;
			}

			popupWindowId = win.id;

			// Reset de ID als de window gesloten wordt
			const onRemoved = (windowId: number) => {
				if (windowId === popupWindowId) {
					popupWindowId = undefined;
					chrome.windows.onRemoved.removeListener(onRemoved);
				}
			};
			chrome.windows.onRemoved.addListener(onRemoved);
		},
	);
});

chrome.tabs.onUpdated.addListener((_1, _2, tab: chrome.tabs.Tab) => {
	updateTab(tab);
});

chrome.tabs.onActivated.addListener((activeInfo: { tabId: number; windowId: number }) => {
	chrome.tabs.get(activeInfo.tabId, (tab: chrome.tabs.Tab) => {
		updateTab(tab);
	});
});
