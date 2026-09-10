import { formatPersonName } from '@/lib/stringUtils';
import type { StudentVisibility } from '@/lib/studentVisibility';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';

export type RegistrationRow = {
	id: number;
	reasonKey: string;
	reasonLabel: string;
	studentId: number;
	studentName: string;
	classCode?: string;
	lessonHourStart?: number;
	lessonHourEnd?: number;
	start?: string;
	end?: string;
};

export type GroupedRegistrationStudent = {
	studentId: number;
	studentName: string;
	classCode?: string;
	registrations: RegistrationRow[];
};

function normalizeKey(s: string) {
	return s.replace(/[^a-z0-9]+/gi, '').toLowerCase();
}

export function buildFilterPairs(data: RegistrationsResponse) {
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

function reasonLabelForKey(
	reasonKey: string,
	filterPairs: { key: string; label: string }[],
	fallbackType?: string | null,
) {
	return filterPairs.find((p) => p.key === reasonKey)?.label ?? (fallbackType ? fallbackType : 'Onbekend');
}

type RegistrationItem = NonNullable<RegistrationsResponse['items']>[number];

function collectRegistrationRowsForItem(
	item: RegistrationItem,
	filterPairs: { key: string; label: string }[],
): RegistrationRow[] {
	const rows: RegistrationRow[] = [];
	const studentName = formatPersonName(item.roepnaam, item.tussenvoegsel, item.achternaam);
	const classCode = item.stamklas?.code;

	for (const appointment of item.afspraken ?? []) {
		for (const v of appointment.verantwoordingen ?? []) {
			const reasonKey = normalizeKey(v.reden?.type ?? 'unknown');
			rows.push({
				id: v.id,
				reasonKey,
				reasonLabel: reasonLabelForKey(reasonKey, filterPairs, v.reden?.type),
				studentId: item.id,
				studentName,
				classCode,
				lessonHourStart: appointment.lesuurBegin,
				lessonHourEnd: appointment.lesuurEinde,
				start: appointment.begin,
				end: appointment.einde,
			});
		}
	}

	return rows;
}

export function buildRegistrationRows(
	data: RegistrationsResponse,
	isVisible: StudentVisibility,
	filterPairs: { key: string; label: string }[],
) {
	const byReason = new Map<string, RegistrationRow[]>();

	for (const item of data.items ?? []) {
		if (!isVisible(item.id)) continue;

		for (const row of collectRegistrationRowsForItem(item, filterPairs)) {
			const arr = byReason.get(row.reasonKey) ?? [];
			arr.push(row);
			byReason.set(row.reasonKey, arr);
		}
	}

	return byReason;
}

export function sortRegistrationRows(byReason: Map<string, RegistrationRow[]>) {
	for (const arr of byReason.values()) {
		arr.sort((a, b) => {
			const hourA = a.lessonHourStart ?? 0;
			const hourB = b.lessonHourStart ?? 0;
			if (hourA !== hourB) return hourB - hourA;
			return a.studentName.localeCompare(b.studentName);
		});
	}
}

export function groupRegistrationRowsByStudent(rows: RegistrationRow[]): GroupedRegistrationStudent[] {
	const byStudent = new Map<number, GroupedRegistrationStudent>();

	for (const row of rows) {
		let group = byStudent.get(row.studentId);
		if (!group) {
			group = {
				studentId: row.studentId,
				studentName: row.studentName,
				classCode: row.classCode,
				registrations: [],
			};
			byStudent.set(row.studentId, group);
		}
		group.registrations.push(row);
	}

	const groups = Array.from(byStudent.values());
	for (const group of groups) {
		group.registrations.sort((a, b) => (a.lessonHourStart ?? 0) - (b.lessonHourStart ?? 0));
	}

	groups.sort((a, b) => {
		const maxHourA = Math.max(...a.registrations.map((x) => x.lessonHourStart ?? 0));
		const maxHourB = Math.max(...b.registrations.map((x) => x.lessonHourStart ?? 0));
		if (maxHourA !== maxHourB) return maxHourB - maxHourA;
		return a.studentName.localeCompare(b.studentName);
	});

	return groups;
}

export function buildOrderedReasons(
	filterPairs: { key: string; label: string }[],
	byReason: Map<string, RegistrationRow[]>,
) {
	const knownKeys = new Set(filterPairs.map((p) => p.key));
	const extraKeys = Array.from(byReason.keys()).filter((k) => !knownKeys.has(k));

	return [
		...filterPairs.filter((p) => byReason.has(p.key)),
		...extraKeys.map((k) => ({ key: k, label: (byReason.get(k)?.[0]?.reasonLabel ?? k) as string })),
	];
}

export function countAbsentRegistrations(data: RegistrationsResponse, isVisible: StudentVisibility) {
	let count = 0;
	for (const item of data.items ?? []) {
		if (!isVisible(item.id)) continue;

		for (const appointment of item.afspraken ?? []) {
			for (const v of appointment.verantwoordingen ?? []) {
				if (v.reden?.type?.toLowerCase() === 'absent') {
					count++;
				}
			}
		}
	}
	return count;
}
