import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import agendaData from '@data/agenda.json' with { type: 'json' };
import students from '@data/leerlingen.json' with { type: 'json' };
import lockers from '@data/lockers.json' with { type: 'json' };
import staffMembers from '@data/medewerkers.json' with { type: 'json' };
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Locker } from '@/magister/response/locker.types';
import type { StaffMember } from '@/magister/response/staffmember.types';
import type { StudentBase } from '@/magister/response/student.types';
import type { StoredReturnMeasureTemplate } from './returnMeasures';

export function getAllStudents(): StudentBase[] {
	return students.data;
}

export function getAllStaffMembers(): StaffMember[] {
	return staffMembers.data;
}

export function getAllLockers(): Locker[] {
	return lockers.lockersDetails;
}

export function getAllAgendaItems(): Record<number, AgendaItem[]> {
	return agendaData as Record<number, AgendaItem[]>;
}

const DATA_VERSION_FILE_PATH = join(import.meta.dirname, '../../../data/data-version.json');

export function getDataVersion(): string {
	if (!existsSync(DATA_VERSION_FILE_PATH)) return '0';
	const parsed = JSON.parse(readFileSync(DATA_VERSION_FILE_PATH, 'utf-8')) as { version?: string };
	return parsed.version ?? '0';
}

const TERUGKOMMAATREGELEN_FILE_PATH = join(import.meta.dirname, '../../../data/terugkommaatregelen.json');

export function getReturnMeasureTemplates(): Record<number, StoredReturnMeasureTemplate[]> {
	if (!existsSync(TERUGKOMMAATREGELEN_FILE_PATH)) return {};
	return JSON.parse(readFileSync(TERUGKOMMAATREGELEN_FILE_PATH, 'utf-8')) as Record<
		number,
		StoredReturnMeasureTemplate[]
	>;
}
