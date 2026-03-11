import type { Links } from '@/magister/types';

export type Parent = {
	id: number;
	voorletters: string;
	tussenvoegsel: string | null;
	achternaam: string;
	aanhef: {
		id: number;
		omschrijving: string;
		korteOmschrijving: string;
		links: Links;
	} | null;
	verzorgerTypeId: number | null;
	verzorgerType: string | null;
	geslacht: string;
	volgnummer: number;
	heeftToestemming: boolean;
	nationaliteit: {
		id: number;
		omschrijving: string;
	};
	isPostOntvanger: boolean;
	geboorteland: {
		id: number;
		omschrijving: string;
	};
	links: Links;
};

export type ParentsResponse = {
	items: Parent[];
	links: Links;
	totalCount: number;
};
