import {
	addDays,
	addSchoolDays,
	getDateKey,
	getNow,
	parseOptionalDate,
	toISOFromDateKeyAndTime,
} from '@/lib/shared/dateUtils';
import type { ReturnMeasureHandler, ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { StaffMember } from '@/magister/response/staffMember.types';
import type { StudentBase } from '@/magister/response/student.types';
import type { StoredReturnMeasureTemplate } from './returnMeasures.types';

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

export function toStudentDetails(student: StudentBase): ReturnMeasureStudent['leerling'] {
	const code = student.klassen[0] ?? 'onbekend';
	const id = classId(code);
	return {
		id: student.id,
		voorletters: student.voorletters,
		roepnaam: student.roepnaam,
		tussenvoegsel: student.tussenvoegsel || null,
		achternaam: student.achternaam,
		stamklas: {
			id,
			code,
			links: { self: { href: `/api/groepen/${id}` } },
		},
		links: {
			self: { href: `/api/leerlingen/${student.id}` },
			foto: { href: `/api/leerlingen/${student.id}/foto` },
		},
	};
}

function isOnOrAfterBegin(dateKey: string, beginParam: string): boolean {
	const start = parseOptionalDate(beginParam);
	if (start === null) return true;
	return dateKey >= getDateKey(start);
}

function isOnOrBeforeEnd(dateKey: string, endParam: string): boolean {
	const end = parseOptionalDate(endParam);
	if (end === null) return true;
	return dateKey <= getDateKey(end);
}

/**
 * The instants in the `begin`/`einde` params mark local days, and Magister filters on whole
 * days, so a measure on the `einde` day is still included.
 */
export function isWithinRange(dateKey: string, beginParam: string, endParam: string): boolean {
	return isOnOrAfterBegin(dateKey, beginParam) && isOnOrBeforeEnd(dateKey, endParam);
}

function measureId(templateId: number, dayIndex: number): number {
	if (dayIndex === 0) return templateId;
	return templateId * 100 + dayIndex;
}

function optionalDayIso(dateKey: string | null, time: string): string | null {
	if (dateKey === null) return null;
	return toISOFromDateKeyAndTime(dateKey, time);
}

function handledAtIso(dateKey: string | null, handledTime: string | null): string | null {
	if (dateKey === null) return null;
	if (handledTime === null) return null;
	return toISOFromDateKeyAndTime(dateKey, handledTime);
}

function resolveHandler(handledById: number | null, staffById: Map<number, StaffMember>): ReturnMeasureHandler | null {
	if (handledById === null) return null;
	const staffMember = staffById.get(handledById);
	if (staffMember === undefined) return null;
	return toHandler(staffMember);
}

function measureLinks(studentId: number, id: number): ReturnMeasureStudent['links'] {
	return {
		self: { href: '/api/m6/leerlingen/terugkomers' },
		terugkommaatregelen: {
			href: `/api/leerlingen/${studentId}/verantwoordingen/terugkommaatregelen`,
		},
		melden: { href: `/api/terugkommaatregelen/${id}/melding` },
	};
}

export function buildReturnMeasureStudent(
	template: StoredReturnMeasureTemplate,
	dateKey: string | null,
	studentDetails: ReturnMeasureStudent['leerling'],
	studentId: number,
	staffById: Map<number, StaffMember>,
	dayIndex: number,
): ReturnMeasureStudent {
	const id = measureId(template.id, dayIndex);
	return {
		id,
		leerling: studentDetails,
		maatregel: template.measure,
		heeftGemeld: template.hasReported,
		heeftNietGemeld: template.hasNotReported,
		begin: optionalDayIso(dateKey, template.startTime),
		einde: optionalDayIso(dateKey, template.endTime),
		afgehandeldOp: handledAtIso(dateKey, template.handledTime),
		afgehandeldDoor: resolveHandler(template.handledById, staffById),
		omschrijving: template.description,
		links: measureLinks(studentId, id),
	};
}

function daySpan(template: StoredReturnMeasureTemplate): number {
	const raw = template.dayCount ?? 1;
	return Math.max(raw, 1);
}

function expandScheduledDays(
	template: StoredReturnMeasureTemplate,
	startOffset: number,
	studentDetails: ReturnMeasureStudent['leerling'],
	studentId: number,
	staffById: Map<number, StaffMember>,
	beginParam: string,
	endParam: string,
): ReturnMeasureStudent[] {
	const startDate = addDays(getNow(), startOffset);
	const measures: ReturnMeasureStudent[] = [];

	for (let dayIndex = 0; dayIndex < daySpan(template); dayIndex++) {
		const dateKey = getDateKey(addSchoolDays(startDate, dayIndex + 1));
		if (!isWithinRange(dateKey, beginParam, endParam)) continue;
		measures.push(buildReturnMeasureStudent(template, dateKey, studentDetails, studentId, staffById, dayIndex));
	}

	return measures;
}

export function expandOneTemplate(
	template: StoredReturnMeasureTemplate,
	studentDetails: ReturnMeasureStudent['leerling'],
	studentId: number,
	staffById: Map<number, StaffMember>,
	beginParam: string,
	endParam: string,
): ReturnMeasureStudent[] {
	if (template.dayOffset === null) {
		return [buildReturnMeasureStudent(template, null, studentDetails, studentId, staffById, 0)];
	}

	return expandScheduledDays(
		template,
		template.dayOffset,
		studentDetails,
		studentId,
		staffById,
		beginParam,
		endParam,
	);
}
