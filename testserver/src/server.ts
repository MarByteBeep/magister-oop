import { readdirSync } from 'node:fs';
import path from 'node:path';
import { serve } from 'bun';
import dotenv from 'dotenv';
import { GET as getStudentAddress } from './api/leerlingen/adresgegevens';
import { GET as getStudentAgenda } from './api/leerlingen/afspraken';
import { GET as getStudentParents } from './api/leerlingen/ouders';
import { GET as getStudentDetails } from './api/leerlingen/personalia';
import { POST as createAccountability } from './api/medewerkers/afspraken/verantwoordingen';
import { GET as getParentAddress } from './api/ouders/adresgegevens';
import { GET as getParentContactDetails } from './api/ouders/contactgegevens';
import { GET as getParentChildren } from './api/ouders/kinderen';
import { GET as getPhoto } from './api/photos/handler';

dotenv.config({ path: '../.env' });

const port = Number(process.env.VITE_TESTSERVER_PORT);
if (!port || port <= 0) {
	throw new Error('Missing or invalid port in .env file');
}

export const serverUrl = `http://localhost:${port}`;

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

type RouteModule = {
	[K in HTTPMethod]?: (req: Request, id?: number) => Promise<Response> | Response;
};

const apiDir = path.join(import.meta.dir, 'api');
const staticRoutes = new Map<string, RouteModule>();
const dynamicHandlers = new Map<string, (req: Request, id: number) => Promise<Response> | Response>();

// List of utility files that should NOT be registered as direct API endpoints
const utilityFiles = [
	'utils/search.ts',
	'leerlingen/adresgegevens.ts',
	'leerlingen/afspraken.ts',
	'leerlingen/ouders.ts',
	'leerlingen/personalia.ts',
	'ouders/adresgegevens.ts',
	'ouders/contactgegevens.ts',
	'ouders/kinderen.ts',
	'photos/handler.ts',
	'medewerkers/afspraken/verantwoordingen.ts',
];

// Function to recursively get all .ts files in a directory
function getTsFiles(dir: string, baseDir: string): string[] {
	let files: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files = files.concat(getTsFiles(fullPath, baseDir));
		} else if (entry.isFile() && entry.name.endsWith('.ts')) {
			files.push(fullPath);
		}
	}
	return files;
}

// Load static routes
const allApiFiles = getTsFiles(apiDir, apiDir);

for (const filePath of allApiFiles) {
	let relativePath = path.relative(apiDir, filePath);
	// Normalize path separators to forward slashes
	relativePath = relativePath.replace(/\\/g, '/');

	// Exclude dynamic photo handlers and utility files from static routes
	if (utilityFiles.includes(relativePath)) {
		console.log(`Skipping utility/dynamic route file: ${relativePath}`);
		continue;
	}

	const routePath = '/api/' + relativePath.replace('.ts', '');
	console.log(`Attempting to load static route: ${routePath} from file: ${filePath}`);
	try {
		const module = (await import(`file://${filePath}`)) as RouteModule;
		staticRoutes.set(routePath, module);
		console.log(`Successfully loaded static route: ${routePath}`);
	} catch (e) {
		console.error(`Failed to load module for static route ${routePath} from ${filePath}:`, e);
	}
}

console.log('All static routes registered:', Array.from(staticRoutes.keys()));

// Register dynamic handlers
dynamicHandlers.set('leerlingen/adresgegevens', getStudentAddress);
dynamicHandlers.set('leerlingen/afspraken', getStudentAgenda);
dynamicHandlers.set('leerlingen/ouders', getStudentParents);
dynamicHandlers.set('leerlingen/personalia', getStudentDetails);
dynamicHandlers.set('leerlingen/foto', getPhoto);
dynamicHandlers.set('ouders/adresgegevens', getParentAddress);
dynamicHandlers.set('ouders/contactgegevens', getParentContactDetails);
dynamicHandlers.set('ouders/kinderen', getParentChildren);
dynamicHandlers.set('medewerkers/foto', getPhoto);

serve({
	port,
	async fetch(req) {
		const url = new URL(req.url);
		const pathname = url.pathname;
		const method = req.method.toUpperCase() as HTTPMethod;

		console.log(`Incoming request: ${method} ${pathname}: ${req.url}`);

		// Handle CORS preflight requests
		if (method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
					'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
				},
			});
		}

		const defaultHeaders = {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*', // Allow all origins for local development
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		// 0. Handle nested routes: /api/medewerkers/afspraken/{appointmentId}/verantwoordingen
		const nestedRouteMatch = pathname.match(/^\/api\/medewerkers\/afspraken\/(\d+)\/verantwoordingen$/);
		if (nestedRouteMatch && method === 'POST') {
			const appointmentId = parseInt(nestedRouteMatch[1], 10);
			try {
				console.log(`Matched nested route: /api/medewerkers/afspraken/${appointmentId}/verantwoordingen`);
				const response = await createAccountability(req, appointmentId);
				return new Response(response.body, {
					status: response.status,
					headers: { ...defaultHeaders, ...Object.fromEntries(response.headers.entries()) },
				});
			} catch (err) {
				console.error(err);
				return new Response(JSON.stringify({ error: 'Server Error' }), {
					status: 500,
					headers: defaultHeaders,
				});
			}
		}

		// 1. Handle dynamic routes: /api/{entityType}/{id}/{subEndpoint}
		const dynamicRouteMatch = pathname.match(/^\/api\/(leerlingen|ouders|medewerkers)\/(\d+)\/(.+)$/);

		if (dynamicRouteMatch) {
			const entityType = dynamicRouteMatch[1]; // 'leerlingen' of 'medewerkers'
			const id = parseInt(dynamicRouteMatch[2], 10);
			const subEndpoint = dynamicRouteMatch[3]; // 'personalia', 'foto', 'ouders', etc.

			const handlerKey = `${entityType}/${subEndpoint}`;
			const handler = dynamicHandlers.get(handlerKey);

			if (handler) {
				try {
					console.log(`Matched dynamic route: /api/${entityType}/${id}/${subEndpoint}`);
					const response = await handler(req, id);
					// Merge default headers, maar sta de handler toe om Content-Type voor afbeeldingen te overschrijven
					return new Response(response.body, {
						status: response.status,
						headers: { ...defaultHeaders, ...Object.fromEntries(response.headers.entries()) },
					});
				} catch (err) {
					console.error(err);
					return new Response(JSON.stringify({ error: 'Server Error' }), {
						status: 500,
						headers: defaultHeaders,
					});
				}
			} else {
				return new Response(JSON.stringify({ error: 'Dynamic endpoint Not Found' }), {
					status: 404,
					headers: defaultHeaders,
				});
			}
		}

		// 2. Handle static routes
		const route = staticRoutes.get(pathname);
		if (route) {
			console.log(`Matched static route: ${pathname}`);
			const handler = route[method];
			if (handler) {
				try {
					const response = await handler(req);
					return new Response(response.body, {
						status: response.status,
						headers: { ...defaultHeaders, ...Object.fromEntries(response.headers.entries()) },
					});
				} catch (err) {
					console.error(err);
					return new Response(JSON.stringify({ error: 'Server Error' }), {
						status: 500,
						headers: defaultHeaders,
					});
				}
			} else {
				return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
					status: 405,
					headers: defaultHeaders,
				});
			}
		}

		// 3. Not Found
		console.log(`Route not found for: ${pathname}`);
		return new Response(JSON.stringify({ error: 'Not Found' }), {
			status: 404,
			headers: defaultHeaders,
		});
	},
});

console.log(`🚀 Server running at http://localhost:${port}`);
