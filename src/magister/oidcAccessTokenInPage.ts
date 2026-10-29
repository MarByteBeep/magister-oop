/**
 * Runs inside the Magister tab (MAIN world). Must stay self-contained — chrome.scripting
 * only serializes this function's source, so it cannot import module helpers.
 */
export async function readOidcAccessTokenInPage(): Promise<string> {
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

	return readOidcTokenFromStorage(window.sessionStorage) || readOidcTokenFromStorage(window.localStorage);
}
