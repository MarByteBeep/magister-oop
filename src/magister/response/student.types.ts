export type StudentBase = {
	id: number;
	voorletters: string;
	roepnaam: string;
	tussenvoegsel: string;
	achternaam: string;
	code: string;
	emailadres: string;
	lesgroepen: string[];
	telefoonnummer: string;
	klassen: string[];
	studies: string[];
	externeId: string;
	links: {
		self: {
			href: string;
		};
		foto?: {
			href: string;
		};
	};
};

export type StudentsResponse = {
	items: StudentBase[];
	totalCount: number;
	links: Record<string, { href: string } | null>;
};
