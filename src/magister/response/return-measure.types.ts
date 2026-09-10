/**
 * Return measures ("terugkommaatregelen") come from the bulk list `/api/m6/leerlingen/terugkomers`:
 * one call returns every measure of every student within a date range.
 */

export type Measure = {
	id: number;
	omschrijving: string;
};

export type ReturnMeasureClass = {
	id: number;
	code: string;
	links: {
		self: { href: string };
	};
};

export type ReturnMeasureStudentDetails = {
	id: number;
	voorletters: string;
	roepnaam: string;
	tussenvoegsel: string | null;
	achternaam: string;
	stamklas: ReturnMeasureClass;
	links: {
		self: { href: string };
		foto: { href: string };
	};
};

/** Staff member that settled the return measure. */
export type ReturnMeasureHandler = {
	id: number;
	persoonType: 'medewerker';
	voorletters: string;
	roepnaam: string;
	tussenvoegsel: string;
	achternaam: string;
	links: {
		self: { href: string };
	};
};

export type ReturnMeasureStudent = {
	id: number;
	leerling: ReturnMeasureStudentDetails;
	maatregel: Measure | null;
	heeftGemeld: boolean;
	heeftNietGemeld: boolean;
	/** Null while the measure has not been scheduled yet; such measures have no agenda overlay. */
	begin: string | null; // ISO string
	einde: string | null; // ISO string
	afgehandeldOp: string | null; // ISO string
	afgehandeldDoor: ReturnMeasureHandler | null;
	omschrijving: string;
	links: {
		self: { href: string };
		terugkommaatregelen: { href: string };
		melden: { href: string };
	};
};

/** A return measure with a planned slot, so it can be placed on the agenda. */
export type ScheduledReturnMeasure = ReturnMeasureStudent & {
	begin: string;
	einde: string;
};

export type ReturnMeasureStudentsResponse = {
	items: ReturnMeasureStudent[];
	links: {
		first: { href: string };
		last: { href: string };
	};
	totalCount: number;
};
