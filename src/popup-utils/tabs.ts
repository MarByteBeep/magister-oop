export function setTabIcon(tabId: number, active: boolean) {
	const icons = active
		? {
				16: 'icons/icon16.png',
				32: 'icons/icon32.png',
				48: 'icons/icon48.png',
				128: 'icons/icon128.png',
			}
		: {
				16: 'icons/icon16-disabled.png',
				32: 'icons/icon32-disabled.png',
				48: 'icons/icon48-disabled.png',
				128: 'icons/icon128-disabled.png',
			};

	chrome.action.setIcon({ tabId, path: icons });
}

/** Hosts where the extension toolbar action must stay disabled (no popup). */
const BLOCKED_MAGISTER_HOSTS = new Set(['accounts.magister.net']);

export function isAllowedUrl(urlString: string) {
	const allowedSuffix = 'magister.net';
	try {
		const url = new URL(urlString);
		const hostname = url.hostname.toLowerCase();

		if (BLOCKED_MAGISTER_HOSTS.has(hostname)) {
			return false;
		}

		return hostname.endsWith(allowedSuffix);
	} catch (_) {
		// Invalid URL
		return false;
	}
}

export function updateTab(tab: chrome.tabs.Tab) {
	const allowed = tab.url ? isAllowedUrl(tab.url) : false;
	if (tab.id) {
		setTabIcon(tab.id, allowed);
		allowed ? chrome.action.enable(tab.id) : chrome.action.disable(tab.id);
	}
}
