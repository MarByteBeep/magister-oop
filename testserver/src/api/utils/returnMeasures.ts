import { addDays, getDateKey, getNow, parseOptionalDate, toISOFromDateKeyAndTime } from '@/lib/dateUtils';
import type { Measure, ReturnMeasureHandler, ReturnMeasureStudent } from '@/magister/response/return-measure.types';
import type { StaffMember } from '@/magister/response/staffmember.types';
import type { StudentBase } from '@/magister/response/student.types';

export type StoredReturnMeasureTemplate = {
	id: number;
	/** Days from today; null for a measure that has no slot yet. */
	dayOffset: number | null;
	description: string;
	measure: Measure | null;
	startTime: string;
	endTime: string;
	hasReported: boolean;
	hasNotReported: boolean;
	/** Local HH:mm on the measure's day, or null when it was never handled. */
	handledTime: string | null;
	handledById: number | null;
};

/** Stable id for a class code, since the dummy students only carry the code itself. */
function classId(code: string): number {
	let hash = 0;
	for (const char of code) hash = (hash * 31 + char.charCodeAt(0)) % 100_000;
	return 10_000 + hash;
}

function toHandler(staffMember: StaffMember): ReturnMeasureHandler {
	return {
		id: staffMember.id,
		persoonType: 'medewerker',
		voorletters: staffMember.voorletters,
		roepnaam: staffMember.roepnaam,
		tussenvoegsel: staffMember.tussenvoegsel,
		achternaam: staffMember.achternaam,
		links: { self: { href: `/api/medewerkers/${staffMember.id}` } },
	};
}

function toStudentDetails(student: StudentBase): ReturnMeasureStudent['leerling'] {
	const code = student.klassen[0] ?? 'onbekend';
	return {
		id: student.id,
		voorletters: student.voorletters,
		roepnaam: student.roepnaam,
		tussenvoegsel: student.tussenvoegsel || null,
		achternaam: student.achternaam,
		stamklas: {
			id: classId(code),
			code,
			links: { self: { href: `/api/groepen/${classId(code)}` } },
		},
		links: {
			self: { href: `/api/leerlingen/${student.id}` },
			foto: { href: `/api/leerlingen/${student.id}/foto` },
		},
	};
}

/**
 * The instants in the `begin`/`einde` params mark local days, and Magister filters on whole
 * days, so a measure on the `einde` day is still included.
 */
function isWithinRange(dateKey: string, beginParam: string, endParam: string): boolean {
	const start = parseOptionalDate(beginParam);
	const end = parseOptionalDate(endParam);
	if (start && dateKey < getDateKey(start)) return false;
	if (end && dateKey > getDateKey(end)) return false;
	return true;
}

export function expandReturnMeasureTemplates(
	templates: StoredReturnMeasureTemplate[],
	student: StudentBase,
	staffById: Map<number, StaffMember>,
	beginParam: string,
	endParam: string,
): ReturnMeasureStudent[] {
	const studentDetails = toStudentDetails(student);

	return templates.flatMap((template) => {
		const dateKey = template.dayOffset == null ? null : getDateKey(addDays(getNow(), template.dayOffset));
		if (dateKey != null && !isWithinRange(dateKey, beginParam, endParam)) return [];

		const handler = template.handledById == null ? null : staffById.get(template.handledById);
		const measure: ReturnMeasureStudent = {
			id: template.id,
			leerling: studentDetails,
			maatregel: template.measure,
			heeftGemeld: template.hasReported,
			heeftNietGemeld: template.hasNotReported,
			begin: dateKey == null ? null : toISOFromDateKeyAndTime(dateKey, template.startTime),
			einde: dateKey == null ? null : toISOFromDateKeyAndTime(dateKey, template.endTime),
			afgehandeldOp:
				dateKey == null || template.handledTime == null
					? null
					: toISOFromDateKeyAndTime(dateKey, template.handledTime),
			afgehandeldDoor: handler ? toHandler(handler) : null,
			omschrijving: template.description,
			links: {
				self: { href: '/api/m6/leerlingen/terugkomers' },
				terugkommaatregelen: { href: `/api/leerlingen/${student.id}/verantwoordingen/terugkommaatregelen` },
				melden: { href: `/api/terugkommaatregelen/${template.id}/melding` },
			},
		};

		return [measure];
	});
}
