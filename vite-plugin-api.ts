import { Buffer } from 'node:buffer';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Plugin } from 'vite';

export function apiPlugin(): Plugin {
	let handleApiRequest: (req: Request) => Promise<Response>;

	return {
		name: 'api',
		configureServer: async (server) => {
			// Load Hono app via Vite so path aliases (@/) resolve in testserver code
			const appPath = path.resolve(server.config.root, 'testserver/src/app.ts');
			const mod = await server.ssrLoadModule(pathToFileURL(appPath).href);
			handleApiRequest = mod.app.fetch.bind(mod.app);

			server.middlewares.use(async (req, res, next) => {
				if (!req.url?.startsWith('/api')) {
					return next();
				}

				try {
					const base = `http://${req.headers.host ?? 'localhost'}`;
					const requestUrl = req.url.startsWith('http') ? req.url : base + req.url;
					const method = req.method ?? 'GET';
					const needsBody = method !== 'GET' && method !== 'HEAD';

					const requestHeaders = new Headers();
					for (const [key, value] of Object.entries(req.headers)) {
						if (value !== undefined) {
							requestHeaders.set(key, Array.isArray(value) ? value.join(', ') : String(value));
						}
					}

					let body: Buffer | undefined;
					if (needsBody) {
						const chunks: Buffer[] = [];
						for await (const chunk of req) {
							chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
						}
						if (chunks.length > 0) {
							body = Buffer.concat(chunks);
						}
					}

					const request = new Request(requestUrl, {
						method,
						headers: requestHeaders,
						body: body ? new Uint8Array(body) : undefined,
					});

					const response = await handleApiRequest(request);

					const headers: Record<string, string> = {};
					response.headers.forEach((value, key) => {
						headers[key] = value;
					});
					res.writeHead(response.status, headers);
					if (response.body) {
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
					}
					res.end();
				} catch (err) {
					console.error('[api plugin]', err);
					res.statusCode = 500;
					res.end(JSON.stringify({ error: 'Server Error' }));
				}
			});
		},
	};
}
