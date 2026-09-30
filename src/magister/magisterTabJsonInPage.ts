type CredentialsOption = 'include' | 'omit' | 'same-origin';
type AuthOption = 'cookies' | 'bearer';

export type MagisterTabJsonMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type MagisterTabJsonRequest = {
	method: MagisterTabJsonMethod;
	url: string;
	credentials: CredentialsOption;
	auth: AuthOption;
	body: unknown | null;
	sessionExpiredMessage: string;
	tokenMissingMessage: string;
};

export type MagisterTabJsonResult = { ok: true; status: number; data?: unknown } | { ok: false; error: string };

/**
 * Runs inside the Magister tab (MAIN world). Must stay self-contained — chrome.scripting
 * only serializes this function's source, so it cannot import module helpers.
 */
export async function magisterTabJsonInPage(request: MagisterTabJsonRequest): Promise<MagisterTabJsonResult> {
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

	function bearerAuthHeaders(): { ok: true; data: Record<string, string> } | { ok: false; error: string } {
		const accessToken = readOidcAccessToken();
		if (!accessToken) return { ok: false, error: request.tokenMissingMessage };

		return {
			ok: true,
			data: {
				Accept: 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
		};
	}

	function buildAuthHeaders(): { ok: true; data: Record<string, string> } | { ok: false; error: string } {
		if (request.auth !== 'bearer') return { ok: true, data: { Accept: 'application/json' } };
		return bearerAuthHeaders();
	}

	function isSessionExpiredStatus(status: number): boolean {
		return request.auth === 'bearer' ? status === 401 || status === 403 : status === 404;
	}

	try {
		const headersResult = buildAuthHeaders();
		if (!headersResult.ok) return headersResult;

		const headers: Record<string, string> = { ...headersResult.data };
		const hasBody =
			request.method !== 'GET' &&
			request.method !== 'DELETE' &&
			request.body !== undefined &&
			request.body !== null;
		if (hasBody) headers['Content-Type'] = 'application/json';

		const res = await fetch(request.url, {
			method: request.method,
			credentials: request.credentials,
			headers,
			body: hasBody ? JSON.stringify(request.body) : undefined,
		});

		if (!res.ok) {
			return {
				ok: false,
				error: isSessionExpiredStatus(res.status) ? request.sessionExpiredMessage : `HTTP error ${res.status}`,
			};
		}

		if (request.method === 'GET') {
			const data = (await res.json()) as unknown;
			return { ok: true, status: res.status, data };
		}

		const contentType = res.headers.get('content-type') ?? '';
		if (contentType.includes('application/json')) {
			const text = await res.text();
			if (text.trim().length > 0) {
				return { ok: true, status: res.status, data: JSON.parse(text) as unknown };
			}
		}

		return { ok: true, status: res.status };
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}
