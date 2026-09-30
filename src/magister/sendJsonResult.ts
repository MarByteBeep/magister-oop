import { schoolApiHttpErrorMessage } from '@/magister/schoolApiHttpError';

export type SendJsonResult = { ok: true; status: number; data?: unknown } | { ok: false; error: string };

export type SendJsonMethod = 'POST' | 'PUT' | 'DELETE';

/** For dev `fetch` and other callers that are not injected into the Magister tab. */
export function sendJsonResponseToResult(res: Response, data?: unknown): SendJsonResult {
	if (!res.ok) {
		return { ok: false, error: schoolApiHttpErrorMessage(res.status) };
	}
	return data === undefined ? { ok: true, status: res.status } : { ok: true, status: res.status, data };
}
