export type CredentialsOption = 'include' | 'omit' | 'same-origin';
export type AuthOption = 'cookies' | 'bearer';

export type MagisterTabJsonMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type MagisterTabJsonRequest = {
	method: MagisterTabJsonMethod;
	url: string;
	credentials: CredentialsOption;
	auth: AuthOption;
	/** Pre-read in the page world via `readOidcAccessTokenInPage` when `auth` is `bearer`. */
	accessToken: string;
	body: unknown | null;
	sessionExpiredMessage: string;
	tokenMissingMessage: string;
};

export type MagisterTabJsonResult = { ok: true; status: number; data?: unknown } | { ok: false; error: string };

type AuthHeadersResult = { ok: true; data: Record<string, string> } | { ok: false; error: string };

/**
 * Runs inside the Magister tab (MAIN world). Must stay self-contained — chrome.scripting
 * only serializes this function's source, so it cannot import module helpers.
 * Bearer tokens are passed in on `request.accessToken` (read by a separate injection).
 */
export async function magisterTabJsonInPage(request: MagisterTabJsonRequest): Promise<MagisterTabJsonResult> {
	function bearerAuthHeaders(): AuthHeadersResult {
		if (!request.accessToken) return { ok: false, error: request.tokenMissingMessage };
		return {
			ok: true,
			data: {
				Accept: 'application/json',
				Authorization: `Bearer ${request.accessToken}`,
			},
		};
	}

	function buildAuthHeaders(): AuthHeadersResult {
		if (request.auth !== 'bearer') return { ok: true, data: { Accept: 'application/json' } };
		return bearerAuthHeaders();
	}

	function isSessionExpiredStatus(status: number): boolean {
		if (request.auth === 'bearer') return status === 401 || status === 403;
		return status === 404;
	}

	function requestHasJsonBody(): boolean {
		if (request.method === 'GET' || request.method === 'DELETE') return false;
		return request.body !== undefined && request.body !== null;
	}

	function httpErrorResult(status: number): MagisterTabJsonResult {
		const error = isSessionExpiredStatus(status) ? request.sessionExpiredMessage : `HTTP error ${status}`;
		return { ok: false, error };
	}

	async function parseSuccessBody(res: Response): Promise<MagisterTabJsonResult> {
		if (request.method === 'GET') {
			return { ok: true, status: res.status, data: (await res.json()) as unknown };
		}
		return parseNonGetSuccessBody(res);
	}

	async function parseNonGetSuccessBody(res: Response): Promise<MagisterTabJsonResult> {
		const contentType = res.headers.get('content-type') ?? '';
		if (!contentType.includes('application/json')) return { ok: true, status: res.status };
		const text = await res.text();
		if (text.trim().length === 0) return { ok: true, status: res.status };
		return { ok: true, status: res.status, data: JSON.parse(text) as unknown };
	}

	async function performFetch(headers: Record<string, string>): Promise<MagisterTabJsonResult> {
		const hasBody = requestHasJsonBody();
		if (hasBody) headers['Content-Type'] = 'application/json';
		const res = await fetch(request.url, {
			method: request.method,
			credentials: request.credentials,
			headers,
			body: hasBody ? JSON.stringify(request.body) : undefined,
		});
		if (!res.ok) return httpErrorResult(res.status);
		return parseSuccessBody(res);
	}

	try {
		const headersResult = buildAuthHeaders();
		if (!headersResult.ok) return headersResult;
		return await performFetch({ ...headersResult.data });
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}
