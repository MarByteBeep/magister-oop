import { sleep } from '../utils/sleep';
import { createAddressesResponse } from './adresgegevens';

export async function GET(_req: Request, _id: number): Promise<Response> {
	await sleep(100);
	const response = createAddressesResponse();

	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}
