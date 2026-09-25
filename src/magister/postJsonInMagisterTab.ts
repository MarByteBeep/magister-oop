import { schoolApiHttpErrorMessage } from '@/magister/schoolApiHttpError';

type CredentialsOption = 'include' | 'omit' | 'same-origin';

export type PostResult = { ok: true; status: number } | { ok: false; error: string };

/** For dev `fetch` and other callers that are not injected into the Magister tab. */
export function postResponseToResult(res: Response): PostResult {
	if (!res.ok) {
		return { ok: false, error: schoolApiHttpErrorMessage(res.status) };
	}
	return { ok: true, status: res.status };
}

export async function postJsonInMagisterTab(
	fetchUrl: string,
	requestBody: unknown,
	requestCredentials: CredentialsOption,
	sessionExpiredMessage: string,
): Promise<PostResult> {
	try {
		const res = await fetch(fetchUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: requestCredentials,
			body: JSON.stringify(requestBody),
		});

		if (!res.ok) {
			return {
				ok: false,
				error: res.status === 404 ? sessionExpiredMessage : `HTTP error ${res.status}`,
			};
		}

		return { ok: true, status: res.status };
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}
