import { fakerNL as faker } from '@faker-js/faker';
import type { ContactsResponse } from '@/magister/response/contact.types';
import { sleep } from '../utils/sleep';

export async function GET(_req: Request, _id: number): Promise<Response> {
	await sleep(100);
	const response: ContactsResponse = {
		items: [
			{
				telefoonnummer: faker.helpers.replaceSymbols('033-#######'),
				isGeheim: false,
				id: 1,
				type: 'telefoonnummer',
				label: 'Tel 1',
				soort: '',
				isGebruikerContactGegeven: false,
				links: {},
			},
			{
				telefoonnummer: faker.helpers.replaceSymbols('06-########'),
				isGeheim: false,
				id: 2,
				type: 'telefoonnummer',
				label: 'Tel 2',
				soort: 'Prive',
				isGebruikerContactGegeven: false,
				links: {},
			},
			{
				telefoonnummer: faker.helpers.replaceSymbols('0341-######'),
				isGeheim: false,
				id: 3,
				type: 'telefoonnummer',
				label: 'Tel 3',
				soort: 'Werk',
				isGebruikerContactGegeven: false,
				links: {},
			},
			{
				telefoonnummer: null,
				isGeheim: false,
				id: 4,
				type: 'telefoonnummer',
				label: 'Tel 4',
				soort: '',
				isGebruikerContactGegeven: false,
				links: {},
			},
			{
				emailadres: 'mail@hotmail.com',
				id: 5,
				type: 'emailadres',
				label: 'Email Prive',
				soort: '',
				isGebruikerContactGegeven: false,
				links: {},
			},
			{
				telefoonnummer: faker.helpers.replaceSymbols('06-########'),
				isGeheim: false,
				id: 6,
				type: 'telefoonnummer',
				label: 'Mobiel',
				soort: '',
				isGebruikerContactGegeven: false,
				links: {},
			},
		],
		links: {},
		totalCount: 6,
	};

	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}
