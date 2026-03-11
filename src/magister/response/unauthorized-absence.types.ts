export type AbsenceFilterType = {
	count: number;
	name: string;
	id: number;
};

export type Class = {
	id: number;
	code: string;
};

export type Appointment = {
	id: number;
	begin: string; // ISO string
	einde: string; // ISO string
	lesuurBegin: number;
	lesuurEinde: number;
	omschrijving: string;
	organisatorPersoonIds: number[];
	isVerantwoord: boolean;
	verantwoordingen: Justification[];
	links: {
		verantwoordingen: { href: string };
		verantwoordingenDeelnemer: { href: string };
	};
};

export type Justification = {
	id: number;
	reden: Reason;
	opmerking: string | null;
	links: {
		self: { href: string };
	};
};

export type Reason = {
	id: number;
	code: string;
	type: string;
	isGeoorloofd: boolean;
	omschrijving: string;
};

export type UnauthorizedAbsenceItem = {
	id: number;
	voorletters: string;
	roepnaam: string;
	tussenvoegsel: string | null;
	achternaam: string;
	stamklas: Class;
	stamnummer: string;
	afwezigheidsredenen: string | null;
	afspraken: Appointment[];
	links: {
		foto: { href: string };
	};
};

export type UnauthorizedAbsencesResponse = {
	filters: {
		types: AbsenceFilterType[];
	};
	items: UnauthorizedAbsenceItem[];
	links: {
		first: { href: string };
		last: { href: string };
	};
	totalCount: number;
};
