import type { Links } from '@/magister/types';

export type Child = {
	id: number;
	roepnaam: string;
	voorletters: string;
	tussenvoegsel: string | null;
	achternaam: string;
	aanmeldingStatus: string;
	actieveAanmeldingen: {
		stamklas: {
			code: string;
			links: Links;
		};
		links: Links;
	}[];
	links: Links;
};

export type ChildrenResponse = {
	items: Child[];
	links: Links;
	totalCount: number;
};
