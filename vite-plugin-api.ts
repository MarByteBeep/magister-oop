import { Buffer } from 'node:buffer';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Plugin, ViteDevServer } from 'vite';

function buildRequestHeaders(req: IncomingMessage) {
	const requestHeaders = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (value !== undefined) {
			requestHeaders.set(key, Array.isArray(value) ? value.join(', ') : String(value));
		}
	}
	return requestHeaders;
}

async function readRequestBody(req: IncomingMessage) {
	const chunks: Buffer[] = [];
	for await (const chunk of req) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}
	return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

async function buildIncomingRequest(req: IncomingMessage) {
	const base = `http://${req.headers.host ?? 'localhost'}`;
	const requestUrl = req.url?.startsWith('http') ? req.url : base + (req.url ?? '');
	const method = req.method ?? 'GET';
	const needsBody = method !== 'GET' && method !== 'HEAD';
	const body = needsBody ? await readRequestBody(req) : undefined;

	return new Request(requestUrl, {
		method,
		headers: buildRequestHeaders(req),
		body: body ? new Uint8Array(body) : undefined,
	});
}

async function writeFetchResponse(res: ServerResponse, response: Response) {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	res.writeHead(response.status, headers);

	if (!response.body) {
		res.end();
		return;
	}

	const reader = response.body.getReader();
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			res.write(Buffer.from(value));
		}
	} finally {
		reader.releaseLock();
	}
	res.end();
}

async function handleApiMiddleware(
	req: IncomingMessage,
	res: ServerResponse,
	next: () => void,
	handleApiRequest: (request: Request) => Promise<Response>,
) {
	if (!req.url?.startsWith('/api')) {
		return next();
	}

	try {
		const request = await buildIncomingRequest(req);
		const response = await handleApiRequest(request);
		await writeFetchResponse(res, response);
	} catch (err) {
		console.error('[api plugin]', err);
		res.statusCode = 500;
		res.end(JSON.stringify({ error: 'Server Error' }));
	}
}

export function apiPlugin(): Plugin {
	let handleApiRequest: (req: Request) => Promise<Response>;

	return {
		name: 'api',
		configureServer: async (server: ViteDevServer) => {
			const appPath = path.resolve(server.config.root, 'testserver/src/app.ts');
			const mod = await server.ssrLoadModule(pathToFileURL(appPath).href);
			handleApiRequest = mod.app.fetch.bind(mod.app);

			server.middlewares.use((req, res, next) => {
				void handleApiMiddleware(req, res, next, handleApiRequest);
			});
		},
	};
}
