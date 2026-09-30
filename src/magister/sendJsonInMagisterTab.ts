import { schoolApiHttpErrorMessage } from '@/magister/schoolApiHttpError';

type CredentialsOption = 'include' | 'omit' | 'same-origin';

export type SendJsonResult = { ok: true; status: number } | { ok: false; error: string };

export type SendJsonMethod = 'POST' | 'PUT';

/** For dev `fetch` and other callers that are not injected into the Magister tab. */
export function sendJsonResponseToResult(res: Response): SendJsonResult {
	if (!res.ok) {
		return { ok: false, error: schoolApiHttpErrorMessage(res.status) };
	}
	return { ok: true, status: res.status };
}

export async function sendJsonInMagisterTab(
	fetchUrl: string,
	method: SendJsonMethod,
	requestBody: unknown,
	requestCredentials: CredentialsOption,
	sessionExpiredMessage: string,
): Promise<SendJsonResult> {
	try {
		const res = await fetch(fetchUrl, {
			method,
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
