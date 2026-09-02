import type { Links } from '@/magister/types';

export type Measure = {
	id: number;
	omschrijving: string;
	links: Links;
};

export type ReturnMeasure = {
	id: number;
	begin: string; // ISO string
	einde: string; // ISO string
	maatregel: Measure | null;
	omschrijving: string | null;
	links: Links;
};

export type ReturnMeasuresResponse = {
	items: ReturnMeasure[];
	links: {
		first: { href: string };
		last: { href: string };
	};
	totalCount: number;
};
