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

export function isAllowedUrl(urlString: string) {
	const allowed = ['magister.net'];
	try {
		const url = new URL(urlString);
		const hostname = url.hostname.toLowerCase();

		return allowed.some((domain) => hostname.endsWith(domain));
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
