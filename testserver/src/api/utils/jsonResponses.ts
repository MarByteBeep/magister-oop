const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function jsonError(error: string, status: number): Response {
	return new Response(JSON.stringify({ error }), {
		status,
		headers: JSON_HEADERS,
	});
}

export function jsonOk(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: JSON_HEADERS,
	});
}

export async function readJsonBody<T>(req: Request): Promise<T | null> {
	try {
		return (await req.json()) as T;
	} catch {
		return null;
	}
}
