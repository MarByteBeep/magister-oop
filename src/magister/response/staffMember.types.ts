export type StaffMember = {
	id: number;
	voorletters: string;
	roepnaam: string;
	tussenvoegsel: string;
	achternaam: string;
	code: string;
	emailadres: string;
	telefoonnummer: string;
	links: {
		self: {
			href: string;
		};
		foto?: {
			href: string;
		};
	};
};
