import type { AddressesResponse } from '@/magister/response/address.types';
import { sleep } from '../utils/sleep';

export async function GET(_req: Request, _id: number): Promise<Response> {
	await sleep(100);
	const response: AddressesResponse = {
		items: [
			{
				idGemeente: 189,
				gemeente: 'Putten',
				straat: 'Roosendaalseweg',
				huisnummer: '111',
				toevoeging: 'a',
				postcode: '3882 AM',
				plaats: 'Putten',
				isGeheim: false,
				idLand: 183,
				land: 'Nederland',
				type: 'woon',
				isBuitenlandsAdres: false,
				links: {},
			},
			{
				idGemeente: null,
				gemeente: null,
				straat: 'Hoofdstraat',
				huisnummer: '444',
				toevoeging: null,
				postcode: '3881 AM',
				plaats: 'Putten',
				isGeheim: false,
				idLand: 183,
				land: 'Nederland',
				type: 'post',
				isBuitenlandsAdres: false,
				links: {},
			},
		],
		links: {},
		totalCount: 2,
	};

	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}
