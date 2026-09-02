import type { Links } from '@/magister/types';

export type Participant = AttendanceGroup | AttendanceStaffMember | AttendanceStudent;

export type AttendanceGroup = {
	code: string;
	omschrijving: string;
	id: number;
	type: 'groep';
	links: {
		self: { href: string };
	};
};

export type AttendanceStaffMember = {
	code: string;
	voorletters: string;
	roepnaam: string;
	tussenvoegsel: string | null;
	achternaam: string;
	id: number;
	type: 'medewerker';
	links: {
		self: { href: string };
	};
};

export type AttendanceStudent = {
	stamklas: string | null;
	voorletters: string;
	roepnaam: string;
	tussenvoegsel: string | null;
	achternaam: string;
	id: number;
	type: 'leerling';
	links: Links;
};

export type AgendaItemCourse = {
	id: number;
	code: string;
	omschrijving: string;
	links: Links;
};

export type AgendaItemLocation = {
	id?: number;
	code?: string;
	omschrijving?: string;
	type: string;
	links: Links;
};

export type AgendaItemRepeatStatus = 'geen' | 'gewijzigd' | 'herhaling';

export type AgendaItem = {
	id: number;
	heeftInhoud: boolean;
	heeftAantekening: boolean;
	onderwijstijd: number;
	subtype: string;
	heeftBijlagen: boolean;
	herhaalStatus: AgendaItemRepeatStatus;
	begin: string; // ISO string
	einde: string; // ISO string
	lesuur?: { begin: number; einde: number };
	onderwerp: string;
	type: string;
	opmerking?: string | null;
	isPrive?: boolean;
	deelnames: Participant[];
	fetched?: string;
	vakken: AgendaItemCourse[];
	locaties: AgendaItemLocation[];
	links: Links;
};

export type AgendaResponse = {
	items: AgendaItem[];
	totalCount: number;
	links: Record<string, { href: string } | null>;
};
