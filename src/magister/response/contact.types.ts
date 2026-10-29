import type { Links } from '@/magister/types';

export type ContactItemBase = {
	id: number;
	label: string;
	soort: string;
	isGebruikerContactGegeven: boolean;
	links: Links;
};

export type ContactItem =
	| (ContactItemBase & {
			type: 'telefoonnummer';
			telefoonnummer: string | null;
			isGeheim: boolean;
	  })
	| (ContactItemBase & {
			type: 'emailadres';
			emailadres: string;
	  });

export type ContactsResponse = {
	items: ContactItem[];
	links: Links;
	totalCount: number;
};
