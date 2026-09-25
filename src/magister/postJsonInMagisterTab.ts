type CredentialsOption = 'include' | 'omit' | 'same-origin';

type PostResult = { ok: true; status: number } | { ok: false; error: string };

export async function postJsonInMagisterTab(
	fetchUrl: string,
	requestBody: unknown,
	requestCredentials: CredentialsOption,
): Promise<PostResult> {
	try {
		const res = await fetch(fetchUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: requestCredentials,
			body: JSON.stringify(requestBody),
		});

		return { ok: true, status: res.status };
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}
