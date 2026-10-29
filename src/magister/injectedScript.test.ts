import { describe, expect, mock, test } from 'bun:test';
import { fetchBlobInMagisterTab } from '@/magister/fetchBlobInMagisterTab';
import { magisterTabJsonInPage } from '@/magister/magisterTabJsonInPage';
import { readOidcAccessTokenInPage } from '@/magister/oidcAccessTokenInPage';
import { checkSchoolSessionReadyInPage } from '@/popup-utils/tabs';

/** Mimics chrome.scripting.executeScript: only the function source travels to the page. */
function invokeAsInjectedScript<T, Args extends unknown[]>(fn: (...args: Args) => T, ...args: Args): T {
	const isolated = new Function(`return (${fn.toString()})`)() as (...args: Args) => T;
	return isolated(...args);
}

function mockFetch(response: Response): typeof fetch {
	return mock(() => Promise.resolve(response)) as unknown as typeof fetch;
}

function createOidcStorage(token: string | null): Storage {
	const entries = token === null ? [] : [['oidc.user:test', JSON.stringify({ access_token: token })]];
	return {
		length: entries.length,
		key: (index) => entries[index]?.[0] ?? null,
		getItem: (key) => entries.find(([entryKey]) => entryKey === key)?.[1] ?? null,
		setItem: () => {},
		removeItem: () => {},
		clear: () => {},
	};
}

describe('injected script functions', () => {
	test('magisterTabJsonInPage GET runs without module-scope references', async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = mockFetch(new Response(JSON.stringify({ value: 1 }), { status: 200 }));

		try {
			const result = await invokeAsInjectedScript(magisterTabJsonInPage, {
				method: 'GET',
				url: 'https://school.magister.net/api/test',
				credentials: 'include',
				auth: 'cookies',
				accessToken: '',
				body: null,
				sessionExpiredMessage: 'session expired',
				tokenMissingMessage: 'token missing',
			});

			expect(result).toEqual({ ok: true, status: 200, data: { value: 1 } });
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test('magisterTabJsonInPage GET bearer auth uses the pre-read access token', async () => {
		const originalFetch = globalThis.fetch;
		const fetchMock = mockFetch(new Response(JSON.stringify({ value: 2 }), { status: 200 }));
		globalThis.fetch = fetchMock;

		try {
			const result = await invokeAsInjectedScript(magisterTabJsonInPage, {
				method: 'GET',
				url: 'https://platform.magister.net/api/test',
				credentials: 'omit',
				auth: 'bearer',
				accessToken: 'test-token',
				body: null,
				sessionExpiredMessage: 'session expired',
				tokenMissingMessage: 'token missing',
			});

			expect(result).toEqual({ ok: true, status: 200, data: { value: 2 } });
			const call = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0];
			const init = call[1] as RequestInit;
			expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test('readOidcAccessTokenInPage returns empty when storage has no token', async () => {
		const originalWindow = globalThis.window;
		globalThis.window = {
			sessionStorage: createOidcStorage(null),
			localStorage: createOidcStorage(null),
		} as Window & typeof globalThis;

		try {
			expect(await invokeAsInjectedScript(readOidcAccessTokenInPage)).toBe('');
		} finally {
			globalThis.window = originalWindow;
		}
	});

	test('readOidcAccessTokenInPage reads the access token from session storage', async () => {
		const originalWindow = globalThis.window;
		globalThis.window = {
			sessionStorage: createOidcStorage('test-token'),
			localStorage: createOidcStorage(null),
		} as Window & typeof globalThis;

		try {
			expect(await invokeAsInjectedScript(readOidcAccessTokenInPage)).toBe('test-token');
		} finally {
			globalThis.window = originalWindow;
		}
	});

	test('magisterTabJsonInPage POST runs without module-scope references', async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = mockFetch(new Response(null, { status: 201 }));

		try {
			const result = await invokeAsInjectedScript(magisterTabJsonInPage, {
				method: 'POST',
				url: 'https://school.magister.net/api/test',
				credentials: 'include',
				auth: 'cookies',
				accessToken: '',
				body: { value: 1 },
				sessionExpiredMessage: 'session expired',
				tokenMissingMessage: 'token missing',
			});

			expect(result).toEqual({ ok: true, status: 201 });
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test('magisterTabJsonInPage treats non-2xx as failure', async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = mockFetch(new Response(null, { status: 500 }));

		try {
			const result = await invokeAsInjectedScript(magisterTabJsonInPage, {
				method: 'PUT',
				url: 'https://school.magister.net/api/test',
				credentials: 'include',
				auth: 'cookies',
				accessToken: '',
				body: {},
				sessionExpiredMessage: 'session expired',
				tokenMissingMessage: 'token missing',
			});

			expect(result).toEqual({ ok: false, error: 'HTTP error 500' });
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test('magisterTabJsonInPage DELETE bearer auth uses the pre-read access token', async () => {
		const originalFetch = globalThis.fetch;
		const fetchMock = mock(() => Promise.resolve(new Response(null, { status: 204 }))) as unknown as typeof fetch;
		globalThis.fetch = fetchMock;

		try {
			const result = await invokeAsInjectedScript(magisterTabJsonInPage, {
				method: 'DELETE',
				url: 'https://attendance.magister.net/api/v2/student/x/absence-notices/y',
				credentials: 'omit',
				auth: 'bearer',
				accessToken: 'test-token',
				body: null,
				sessionExpiredMessage: 'session expired',
				tokenMissingMessage: 'token missing',
			});

			expect(result).toEqual({ ok: true, status: 204 });
			expect(fetchMock).toHaveBeenCalled();
			const call = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0];
			const init = call[1] as RequestInit;
			expect(init.method).toBe('DELETE');
			expect(init.body).toBeUndefined();
			expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test('fetchBlobInMagisterTab runs without module-scope references', async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = mockFetch(new Response(new Blob(['test'], { type: 'text/plain' }), { status: 200 }));

		try {
			const result = await invokeAsInjectedScript(
				fetchBlobInMagisterTab,
				'https://school.magister.net/api/photo',
				'session expired',
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.blob.type.startsWith('text/plain')).toBe(true);
			}
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test('checkSchoolSessionReadyInPage succeeds with a valid cookie session', async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = mockFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }));

		try {
			const ready = await invokeAsInjectedScript(checkSchoolSessionReadyInPage);
			expect(ready).toBe(true);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
