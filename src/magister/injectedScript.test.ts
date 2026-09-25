import { describe, expect, mock, test } from 'bun:test';
import { fetchBlobInMagisterTab } from '@/magister/fetchBlobInMagisterTab';
import { fetchJsonInMagisterTab } from '@/magister/fetchInMagisterTab';
import { postJsonInMagisterTab } from '@/magister/postJsonInMagisterTab';
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
	test('fetchJsonInMagisterTab runs without module-scope references', async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = mockFetch(new Response(JSON.stringify({ value: 1 }), { status: 200 }));

		try {
			const result = await invokeAsInjectedScript(
				fetchJsonInMagisterTab,
				'https://school.magister.net/api/test',
				'include',
				'cookies',
				'session expired',
				'token missing',
			);

			expect(result).toEqual({ ok: true, data: { value: 1 } });
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test('fetchJsonInMagisterTab bearer auth reads OIDC token from storage', async () => {
		const originalFetch = globalThis.fetch;
		const originalWindow = globalThis.window;
		globalThis.fetch = mockFetch(new Response(JSON.stringify({ value: 2 }), { status: 200 }));
		globalThis.window = {
			sessionStorage: createOidcStorage('test-token'),
			localStorage: createOidcStorage(null),
		} as Window & typeof globalThis;

		try {
			const result = await invokeAsInjectedScript(
				fetchJsonInMagisterTab,
				'https://platform.magister.net/api/test',
				'omit',
				'bearer',
				'session expired',
				'token missing',
			);

			expect(result).toEqual({ ok: true, data: { value: 2 } });
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

	test('postJsonInMagisterTab runs without module-scope references', async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = mockFetch(new Response(null, { status: 201 }));

		try {
			const result = await invokeAsInjectedScript(
				postJsonInMagisterTab,
				'https://school.magister.net/api/test',
				{ value: 1 },
				'include',
				'session expired',
			);

			expect(result).toEqual({ ok: true, status: 201 });
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test('postJsonInMagisterTab treats non-2xx as failure', async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = mockFetch(new Response(null, { status: 500 }));

		try {
			const result = await invokeAsInjectedScript(
				postJsonInMagisterTab,
				'https://school.magister.net/api/test',
				{},
				'include',
				'session expired',
			);

			expect(result).toEqual({ ok: false, error: 'HTTP error 500' });
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
