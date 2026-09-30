import { describe, expect, mock, test } from 'bun:test';
import { fetchBlobInMagisterTab } from '@/magister/fetchBlobInMagisterTab';
import { magisterTabJsonInPage } from '@/magister/magisterTabJsonInPage';
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
				body: null,
				sessionExpiredMessage: 'session expired',
				tokenMissingMessage: 'token missing',
			});

			expect(result).toEqual({ ok: true, status: 200, data: { value: 1 } });
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test('magisterTabJsonInPage GET bearer auth reads OIDC token from storage', async () => {
		const originalFetch = globalThis.fetch;
		const originalWindow = globalThis.window;
		globalThis.fetch = mockFetch(new Response(JSON.stringify({ value: 2 }), { status: 200 }));
		globalThis.window = {
			sessionStorage: createOidcStorage('test-token'),
			localStorage: createOidcStorage(null),
		} as Window & typeof globalThis;

		try {
			const result = await invokeAsInjectedScript(magisterTabJsonInPage, {
				method: 'GET',
				url: 'https://platform.magister.net/api/test',
				credentials: 'omit',
				auth: 'bearer',
				body: null,
				sessionExpiredMessage: 'session expired',
				tokenMissingMessage: 'token missing',
			});

			expect(result).toEqual({ ok: true, status: 200, data: { value: 2 } });
		} finally {
			globalThis.fetch = originalFetch;
			globalThis.window = originalWindow;
		}
	});

	test('checkSchoolSessionReadyInPage requires an OIDC token', async () => {
		const originalFetch = globalThis.fetch;
		const originalWindow = globalThis.window;
		const fetchMock = mockFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }));
		globalThis.fetch = fetchMock;
		globalThis.window = {
			sessionStorage: createOidcStorage(null),
			localStorage: createOidcStorage(null),
		} as Window & typeof globalThis;

		try {
			const ready = await invokeAsInjectedScript(checkSchoolSessionReadyInPage);
			expect(ready).toBe(false);
			expect(fetchMock).not.toHaveBeenCalled();
		} finally {
			globalThis.fetch = originalFetch;
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
				body: {},
				sessionExpiredMessage: 'session expired',
				tokenMissingMessage: 'token missing',
			});

			expect(result).toEqual({ ok: false, error: 'HTTP error 500' });
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test('magisterTabJsonInPage DELETE bearer auth reads OIDC token from storage', async () => {
		const originalFetch = globalThis.fetch;
		const originalWindow = globalThis.window;
		const fetchMock = mock(() => Promise.resolve(new Response(null, { status: 204 }))) as unknown as typeof fetch;
		globalThis.fetch = fetchMock;
		globalThis.window = {
			sessionStorage: createOidcStorage('test-token'),
			localStorage: createOidcStorage(null),
		} as Window & typeof globalThis;

		try {
			const result = await invokeAsInjectedScript(magisterTabJsonInPage, {
				method: 'DELETE',
				url: 'https://attendance.magister.net/api/v2/student/x/absence-notices/y',
				credentials: 'omit',
				auth: 'bearer',
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
			globalThis.window = originalWindow;
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

	test('checkSchoolSessionReadyInPage succeeds with token and valid session', async () => {
		const originalFetch = globalThis.fetch;
		const originalWindow = globalThis.window;
		globalThis.fetch = mockFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }));
		globalThis.window = {
			sessionStorage: createOidcStorage('test-token'),
			localStorage: createOidcStorage(null),
		} as Window & typeof globalThis;

		try {
			const ready = await invokeAsInjectedScript(checkSchoolSessionReadyInPage);
			expect(ready).toBe(true);
		} finally {
			globalThis.fetch = originalFetch;
			globalThis.window = originalWindow;
		}
	});
});
