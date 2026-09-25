type FetchBlobResult = { ok: true; blob: { buffer: ArrayBuffer; type: string } } | { ok: false; error: string };

export async function fetchBlobInMagisterTab(
	fetchUrl: string,
	sessionExpiredMessage: string,
): Promise<FetchBlobResult> {
	try {
		const res = await fetch(fetchUrl, {
			method: 'GET',
			credentials: 'include',
		});

		if (!res.ok) {
			const error = res.status === 404 ? sessionExpiredMessage : `HTTP error ${res.status}`;
			return { ok: false, error };
		}

		const blob = await res.blob();
		const buffer = await blob.arrayBuffer();

		return {
			ok: true,
			blob: {
				buffer,
				type: blob.type,
			},
		};
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}
