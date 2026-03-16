import agendaData from '@data/agenda.json' with { type: 'json' };
import students from '@data/leerlingen.json' with { type: 'json' };
import lockers from '@data/lockers.json' with { type: 'json' };
import staffMembers from '@data/medewerkers.json' with { type: 'json' };
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Locker } from '@/magister/response/locker.types';
import type { StaffMember } from '@/magister/response/staffmember.types';
import type { Student } from '@/magister/response/student.types';

export function getAllStudents(): Student[] {
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
