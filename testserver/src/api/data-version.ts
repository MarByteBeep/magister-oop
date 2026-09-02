import { getDataVersion } from './utils/helpers';

export async function GET(): Promise<Response> {
	return new Response(JSON.stringify({ version: getDataVersion() }), {
		headers: { 'Content-Type': 'application/json' },
	});
}
