import type { AddressesResponse } from '@/magister/response/address.types';

export function createAddressesResponse(): AddressesResponse {
	return {
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
}
