import type { Links } from '@/magister/types';

export type Address = {
	idGemeente: number | null;
	gemeente: string | null;
	straat: string;
	huisnummer: string;
	toevoeging: string | null;
	postcode: string;
	plaats: string;
	isGeheim: boolean;
	idLand: number;
	land: string;
	type: string; // e.g., "woon" of "post"
	isBuitenlandsAdres: boolean;
	links: Links;
};

export type AddressesResponse = {
	items: Address[];
	links: Links;
	totalCount: number;
};
