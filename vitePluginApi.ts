import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Plugin, ViteDevServer } from 'vite';
import { buildIncomingRequest, writeFetchResponse } from './vitePluginApiRequest';

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
