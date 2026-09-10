import type {
	ReturnMeasureStudent,
	ReturnMeasureStudentDetails,
	ScheduledReturnMeasure,
} from '@/magister/response/return-measure.types';

export function returnMeasureStudentDetails(studentId = 1): ReturnMeasureStudentDetails {
	return {
		id: studentId,
		voorletters: 'A.',
		roepnaam: 'Ada',
		tussenvoegsel: null,
		achternaam: 'Boyer',
		stamklas: {
			id: 71823,
			code: '3B1',
			links: { self: { href: `/api/groepen/71823` } },
		},
		links: {
			self: { href: `/api/leerlingen/${studentId}` },
			foto: { href: `/api/leerlingen/${studentId}/foto` },
		},
	};
}

/** Shared test payload: the bulk item is too large to rebuild in every test file. */
export function returnMeasureStudent(overrides: Partial<ReturnMeasureStudent> = {}): ReturnMeasureStudent {
	const id = overrides.id ?? 42;
	const studentId = overrides.leerling?.id ?? 1;

	return {
		id,
		leerling: returnMeasureStudentDetails(studentId),
		maatregel: null,
		heeftGemeld: false,
		heeftNietGemeld: false,
		begin: null,
		einde: null,
		afgehandeldOp: null,
		afgehandeldDoor: null,
		omschrijving: 'test',
		links: {
			self: { href: '/api/m6/leerlingen/terugkomers' },
			terugkommaatregelen: { href: `/api/leerlingen/${studentId}/verantwoordingen/terugkommaatregelen` },
			melden: { href: `/api/terugkommaatregelen/${id}/melding` },
		},
		...overrides,
	};
}

export function scheduledReturnMeasure(
	start: string,
	end: string,
	overrides: Partial<ReturnMeasureStudent> = {},
): ScheduledReturnMeasure {
	return { ...returnMeasureStudent(overrides), begin: start, einde: end };
}
