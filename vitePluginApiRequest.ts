import { Buffer } from 'node:buffer';
import type { IncomingMessage, ServerResponse } from 'node:http';

function headerValue(value: string | string[]): string {
	if (Array.isArray(value)) return value.join(', ');
	return String(value);
}

function appendHeader(headers: Headers, key: string, value: string | string[] | undefined): void {
	if (value === undefined) return;
	headers.set(key, headerValue(value));
}

export function buildRequestHeaders(req: IncomingMessage): Headers {
	const requestHeaders = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		appendHeader(requestHeaders, key, value);
	}
	return requestHeaders;
}

function toBuffer(chunk: Buffer | string): Buffer {
	if (Buffer.isBuffer(chunk)) return chunk;
	return Buffer.from(chunk);
}

async function collectChunks(req: IncomingMessage): Promise<Buffer[]> {
	const chunks: Buffer[] = [];
	for await (const chunk of req) {
		chunks.push(toBuffer(chunk as Buffer | string));
	}
	return chunks;
}

export async function readRequestBody(req: IncomingMessage): Promise<Buffer | undefined> {
	const chunks = await collectChunks(req);
	if (chunks.length === 0) return undefined;
	return Buffer.concat(chunks);
}

function requestHost(req: IncomingMessage): string {
	const host = req.headers.host;
	if (typeof host === 'string') return host;
	return 'localhost';
}

export function resolveRequestUrl(req: IncomingMessage): string {
	const url = req.url ?? '';
	if (url.startsWith('http')) return url;
	return `http://${requestHost(req)}${url}`;
}

function isBodylessMethod(method: string): boolean {
	return method === 'GET' || method === 'HEAD';
}

async function maybeReadBody(req: IncomingMessage, method: string): Promise<BodyInit | undefined> {
	if (isBodylessMethod(method)) return undefined;
	const body = await readRequestBody(req);
	if (body === undefined) return undefined;
	return new Uint8Array(body) as BodyInit;
}

export async function buildIncomingRequest(req: IncomingMessage): Promise<Request> {
	const method = req.method ?? 'GET';
	return new Request(resolveRequestUrl(req), {
		method,
		headers: buildRequestHeaders(req),
		body: await maybeReadBody(req, method),
	});
}

function headersFromResponse(response: Response): Record<string, string> {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
}

async function pumpReader(res: ServerResponse, reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
	while (true) {
		const { done, value } = await reader.read();
		if (done) return;
		res.write(Buffer.from(value));
	}
}

async function streamToServerResponse(res: ServerResponse, body: ReadableStream<Uint8Array>): Promise<void> {
	const reader = body.getReader();
	try {
		await pumpReader(res, reader);
	} finally {
		reader.releaseLock();
	}
}

async function writeResponseBody(res: ServerResponse, body: ReadableStream<Uint8Array> | null): Promise<void> {
	if (body === null) return;
	await streamToServerResponse(res, body);
}

export async function writeFetchResponse(res: ServerResponse, response: Response): Promise<void> {
	res.writeHead(response.status, headersFromResponse(response));
	await writeResponseBody(res, response.body);
	res.end();
}
