import type { UUID } from '@/magister/types';

export type AttendanceTypeCode =
	| 'ZK' // Ziek gemeld
	| 'D' // Dokter / Huisarts
	| 'SL' // Schoolleiding
	| 'O' // Orthodontist
	| 'AR' // Aangepast rooster
	| 'F' // Familie omstandigheden
	| 'T'; // Tandarts bezoek

export type AccountRole = 'Parent' | 'SupportingStaff' | 'TeachingStaff';

export interface AbsenceLink {
	href: string;
	rel: 'Modify' | 'Withdraw' | 'Patch';
	method: 'PUT' | 'DELETE' | 'PATCH';
}

export interface Student {
	id: UUID;
	firstName: string;
	lastName: string;
	infix: string | null;
	groups: string[];
	studies: string[];
	zenId: number;
	studentNumber: number;
	hasPhoto: boolean;
}

export interface Unit {
	id: UUID;
	name: string;
}

export interface User {
	role: AccountRole;
	accountId: UUID;
	initials: string;
	lastName: string;
	infix: string | null;
}

export interface AbsenceItem {
	absenceNoticeId: UUID;
	attendanceTypeCode: AttendanceTypeCode;
	attendanceTypeDescription: string;
	startDateTime: string; // ISO string
	endDateTime: string | null; // ISO string or null
	expectedEndDateTime: string | null; // ISO string or null
	createdDateTime: string; // ISO string
	consecutiveDays: number;
	student: Student;
	unit: Unit;
	comment: string;
	internalComment: string;
	creator: User;
	modifiedBy: User | null;
	lastModified: string | null; // ISO string or null
	signals: string[]; // Assuming signals are strings based on "MAZL_LONG"
	attachment: null; // Type could be more specific if structure is known
	links: AbsenceLink[];
	isRecurring: boolean;
}

export interface AbsencesResponse {
	overviewDate: string; // ISO string
	count: number;
	top: number;
	skip: number;
	items: AbsenceItem[];
}
