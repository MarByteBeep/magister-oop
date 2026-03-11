import { fakerNL as faker } from '@faker-js/faker';
import type { ParentsResponse } from '@/magister/response/parent.types';

export async function GET(_req: Request, _id: number): Promise<Response> {
	const response: ParentsResponse = {
		items: [
			{
				id: 40658,
				voorletters: faker.person.firstName().charAt(0),
				tussenvoegsel: null,
				achternaam: faker.person.lastName(),
				aanhef: {
					id: 3,
					omschrijving: 'Mevrouw',
					korteOmschrijving: 'Mevr.',
					links: {},
				},
				verzorgerTypeId: 2,
				verzorgerType: 'moeder',
				geslacht: 'vrouw',
				volgnummer: 1,
				heeftToestemming: true,
				nationaliteit: {
					id: 183,
					omschrijving: 'NEDERLANDSE',
				},
				isPostOntvanger: true,
				geboorteland: {
					id: 183,
					omschrijving: 'Nederland',
				},
				links: {
					self: {
						href: '/api/ouders/40658',
					},
					adresgegevens: {
						href: '/api/ouders/40658/adresgegevens',
					},
					contactgegevens: {
						href: '/api/ouders/40658/contactgegevens',
					},
					kinderen: {
						href: '/api/ouders/40658/kinderen',
					},
				},
			},
			{
				id: 46427,
				voorletters: faker.person.firstName().charAt(0),
				tussenvoegsel: null,
				achternaam: faker.person.lastName(),
				aanhef: null,
				verzorgerTypeId: null,
				verzorgerType: null,
				geslacht: 'vrouw',
				volgnummer: 2,
				heeftToestemming: true,
				nationaliteit: {
					id: 183,
					omschrijving: 'NEDERLANDSE',
				},
				isPostOntvanger: true,
				geboorteland: {
					id: 183,
					omschrijving: 'Nederland',
				},
				links: {
					self: {
						href: '/api/ouders/46427',
					},
					adresgegevens: {
						href: '/api/ouders/46427/adresgegevens',
					},
					contactgegevens: {
						href: '/api/ouders/46427/contactgegevens',
					},
					kinderen: {
						href: '/api/ouders/46427/kinderen',
					},
				},
			},
			{
				id: 43314,
				voorletters: faker.person.firstName().charAt(0),
				tussenvoegsel: null,
				achternaam: faker.person.lastName(),
				aanhef: null,
				verzorgerTypeId: null,
				verzorgerType: null,
				geslacht: 'man',
				volgnummer: 3,
				heeftToestemming: true,
				nationaliteit: {
					id: 183,
					omschrijving: 'NEDERLANDSE',
				},
				isPostOntvanger: true,
				geboorteland: {
					id: 183,
					omschrijving: 'Nederland',
				},
				links: {
					self: {
						href: '/api/ouders/43314',
					},
					adresgegevens: {
						href: '/api/ouders/43314/adresgegevens',
					},
					contactgegevens: {
						href: '/api/ouders/43314/contactgegevens',
					},
					kinderen: {
						href: '/api/ouders/43314/kinderen',
					},
				},
			},
		],
		links: {},
		totalCount: 3,
	};

	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}
