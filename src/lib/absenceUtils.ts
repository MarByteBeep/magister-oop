import type { UnauthorizedAbsencesResponse } from '@/magister/response/unauthorized-absence.types';
import type { Student } from '@/magister/types';

export type AbsenceRow = {
	reasonKey: string;
	reasonLabel: string;
	studentId: number;
	studentName: string;
	classCode?: string;
	lesuurBegin?: number;
	lesuurEinde?: number;
	begin?: string;
	einde?: string;
};

function normalizeKey(s: string) {
	return s.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export function buildFilterPairs(data: UnauthorizedAbsencesResponse) {
	const filters = data.filters?.types ?? [];
	const filterPairs = filters.map((f) => ({ key: normalizeKey(f.name), label: f.name }));

	filterPairs.sort((a, b) => {
		const aIsAbsent = a.label.toLowerCase() === 'absent';
		const bIsAbsent = b.label.toLowerCase() === 'absent';
		if (aIsAbsent && !bIsAbsent) return -1;
		if (!aIsAbsent && bIsAbsent) return 1;
		return 0;
	});

	return filterPairs;
}

function formatStudentName(student: Student) {
	return `${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}`.replace(/\s+/g, ' ').trim();
}

function reasonLabelForKey(
	reasonKey: string,
	filterPairs: { key: string; label: string }[],
	fallbackType?: string | null,
) {
	return filterPairs.find((p) => p.key === reasonKey)?.label ?? (fallbackType ? fallbackType : 'Onbekend');
}

type UnauthorizedAbsenceItem = NonNullable<UnauthorizedAbsencesResponse['items']>[number];

function collectAbsenceRowsForItem(
	item: UnauthorizedAbsenceItem,
	student: Student,
	filterPairs: { key: string; label: string }[],
): AbsenceRow[] {
	const rows: AbsenceRow[] = [];
	const studentName = formatStudentName(student);
	const classCode = student.klassen?.join(', ');

	for (const afspraak of item.afspraken ?? []) {
		for (const v of afspraak.verantwoordingen ?? []) {
			const reasonKey = normalizeKey(v.reden?.type ?? 'unknown');
			rows.push({
				reasonKey,
				reasonLabel: reasonLabelForKey(reasonKey, filterPairs, v.reden?.type),
				studentId: item.id,
				studentName,
				classCode,
				lesuurBegin: afspraak.lesuurBegin,
				lesuurEinde: afspraak.lesuurEinde,
				begin: afspraak.begin,
				einde: afspraak.einde,
			});
		}
	}

	return rows;
}

export function buildAbsenceRows(
	data: UnauthorizedAbsencesResponse,
	studentById: Map<number, Student>,
	allowedStudentIds: Set<number>,
	filterPairs: { key: string; label: string }[],
) {
	const byReason = new Map<string, AbsenceRow[]>();

	for (const item of data.items ?? []) {
		const student = studentById.get(item.id);
		if (!student || !allowedStudentIds.has(student.id)) continue;

		for (const row of collectAbsenceRowsForItem(item, student, filterPairs)) {
			const arr = byReason.get(row.reasonKey) ?? [];
			arr.push(row);
			byReason.set(row.reasonKey, arr);
		}
	}

	return byReason;
}

export function sortAbsenceRows(byReason: Map<string, AbsenceRow[]>) {
	for (const arr of byReason.values()) {
		arr.sort((a, b) => {
			const hourA = a.lesuurBegin ?? 0;
			const hourB = b.lesuurBegin ?? 0;
			if (hourA !== hourB) return hourB - hourA;
			return a.studentName.localeCompare(b.studentName);
		});
	}
}

export function buildOrderedReasons(
	filterPairs: { key: string; label: string }[],
	byReason: Map<string, AbsenceRow[]>,
) {
	const knownKeys = new Set(filterPairs.map((p) => p.key));
	const extraKeys = Array.from(byReason.keys()).filter((k) => !knownKeys.has(k));

	return [
		...filterPairs.filter((p) => byReason.has(p.key)),
		...extraKeys.map((k) => ({ key: k, label: (byReason.get(k)?.[0]?.reasonLabel ?? k) as string })),
	];
}

export function countAbsentForAllowedStudents(data: UnauthorizedAbsencesResponse, allowedStudentIds: Set<number>) {
	let count = 0;
	for (const item of data.items ?? []) {
		if (!allowedStudentIds.has(item.id)) continue;

		for (const afspraak of item.afspraken ?? []) {
			for (const v of afspraak.verantwoordingen ?? []) {
				if (v.reden?.type?.toLowerCase() === 'absent') {
					count++;
				}
			}
		}
	}
	return count;
}
