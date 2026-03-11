import type { Links } from '@/magister/types';

export type StudentDetails = {
	id: number;
	voorletters: string;
	roepnaam: string;
	tussenvoegsel?: string | null;
	achternaam: string;
	officieleVoornamen: string;
	officieleTussenvoegsels: string | null;
	officieleAchternaam: string;
	geboortedatum: string; // YYYY-MM-DD
	geboorteplaats?: string;
	geboortegemeente?: {
		id: number;
		omschrijving: string;
	};
	geboorteland?: {
		id: number;
		omschrijving: string;
	};
	geslacht: string;
	nationaliteit?: {
		id: number;
		omschrijving: string;
	};
	emailadres: string;
	telefoonnummer?: string;
	klassen: string[];
	studies: string[];
	woonsituatie?: {
		id: number;
		omschrijving: string;
	};
	links: Links;
};
