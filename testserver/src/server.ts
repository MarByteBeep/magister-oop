import { serve } from 'bun';
import dotenv from 'dotenv';
import { app } from './app';

dotenv.config({ path: '../.env' });

const port = Number(process.env.VITE_TESTSERVER_PORT);
if (!port || port <= 0) {
	throw new Error('Missing or invalid port in .env file');
}

export const serverUrl = `http://localhost:${port}`;

serve({
	port,
	async fetch(req) {
		console.log(`Incoming request: ${req.method} ${new URL(req.url).pathname}: ${req.url}`);
		return app.fetch(req);
	},
});

console.log(`🚀 Server running at http://localhost:${port}`);
