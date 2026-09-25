import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import agendaData from '@data/agenda.json' with { type: 'json' };
import lockers from '@data/lockers.json' with { type: 'json' };
import staffMembers from '@data/staff-members.json' with { type: 'json' };
import students from '@data/students.json' with { type: 'json' };
import type { AgendaItem, Participant } from '@/magister/response/agenda.types';
import type { Locker } from '@/magister/response/locker.types';
import type { StaffMember } from '@/magister/response/staffmember.types';
import type { StudentBase } from '@/magister/response/student.types';
import type { StoredAbsenceNoticeTemplate } from './absenceNotices';
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

export function getAllAgendaItems(): Record<number, AgendaItem<Participant>[]> {
	return agendaData as Record<number, AgendaItem<Participant>[]>;
}

const RETURN_MEASURES_FILE_PATH = join(import.meta.dirname, '../../../data/return-measures.json');
const ABSENCE_NOTICES_FILE_PATH = join(import.meta.dirname, '../../../data/absence-notices.json');

export function getReturnMeasureTemplates(): Record<number, StoredReturnMeasureTemplate[]> {
	if (!existsSync(RETURN_MEASURES_FILE_PATH)) return {};
	return JSON.parse(readFileSync(RETURN_MEASURES_FILE_PATH, 'utf-8')) as Record<
		number,
		StoredReturnMeasureTemplate[]
	>;
}

export function appendReturnMeasureTemplate(studentId: number, template: StoredReturnMeasureTemplate): void {
	const data = getReturnMeasureTemplates();
	const existing = data[studentId] ?? [];
	writeFileSync(
		RETURN_MEASURES_FILE_PATH,
		JSON.stringify({ ...data, [studentId]: [...existing, template] }, null, 2),
		'utf-8',
	);
}

export function getAbsenceNoticeTemplates(): Record<string, StoredAbsenceNoticeTemplate[]> {
	if (!existsSync(ABSENCE_NOTICES_FILE_PATH)) return {};
	return JSON.parse(readFileSync(ABSENCE_NOTICES_FILE_PATH, 'utf-8')) as Record<
		string,
		StoredAbsenceNoticeTemplate[]
	>;
}
