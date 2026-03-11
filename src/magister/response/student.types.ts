export type Student = {
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
	items: Student[];
	totalCount: number;
	links: Record<string, { href: string } | null>;
};
