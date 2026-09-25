type CredentialsOption = 'include' | 'omit' | 'same-origin';
type AuthOption = 'cookies' | 'bearer';

type FetchResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function fetchJsonInMagisterTab<T>(
	fetchUrl: string,
	credentials: CredentialsOption,
	authMode: AuthOption,
	sessionExpiredMessage: string,
	tokenMissingMessage: string,
): Promise<FetchResult<T>> {
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

	function readOidcAccessToken(): string {
		return readOidcTokenFromStorage(window.sessionStorage) || readOidcTokenFromStorage(window.localStorage);
	}

	function bearerAuthHeaders(): FetchResult<Record<string, string>> {
		const accessToken = readOidcAccessToken();
		if (!accessToken) return { ok: false, error: tokenMissingMessage };

		return {
			ok: true,
			data: {
				Accept: 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
		};
	}

	function buildAuthHeaders(): FetchResult<Record<string, string>> {
		if (authMode !== 'bearer') return { ok: true, data: {} };
		return bearerAuthHeaders();
	}

	function isSessionExpiredStatus(status: number): boolean {
		return authMode === 'bearer' ? status === 401 || status === 403 : status === 404;
	}

	try {
		const headersResult = buildAuthHeaders();
		if (!headersResult.ok) return headersResult;

		const res = await fetch(fetchUrl, {
			method: 'GET',
			credentials,
			headers: headersResult.data,
		});

		if (!res.ok) {
			const expired = isSessionExpiredStatus(res.status);
			return { ok: false, error: expired ? sessionExpiredMessage : `HTTP error ${res.status}` };
		}

		const data = (await res.json()) as T;
		return { ok: true, data };
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}
