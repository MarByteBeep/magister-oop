import { mkdirSync, writeFileSync } from 'node:fs';
import { faker } from '@faker-js/faker';
import type { StaffMember } from '@/magister/response/staffMember.types';
import type { StudentBase } from '@/magister/response/student.types';
import { generateAbsenceNoticeData } from './absence-notices';
import { generateAgendaData } from './agenda';
import {
	ABSENCE_NOTICES_FILE_PATH,
	AGENDA_FILE_PATH,
	DATA_DIR,
	RETURN_MEASURES_FILE_PATH,
	STAFF_MEMBERS_FILE_PATH,
	STUDENTS_FILE_PATH,
} from './paths';
import { generateReturnMeasureData } from './returnMeasures';
import { generateDummyStaffMember } from './staffMember';
import { generateDummyStudent } from './student';

function generateUniqueIds(count: number, min: number, max: number): Set<number> {
	const uniqueIds = new Set<number>();
	while (uniqueIds.size < count) {
		uniqueIds.add(faker.number.int({ min, max }));
	}
	return uniqueIds;
}

export function allocateEntityIds(
	totalStaffMembers: number,
	totalStudents: number,
): {
	staffMemberIds: number[];
	studentIds: number[];
} {
	const totalEntities = totalStudents + totalStaffMembers;
	const allUniqueIds = Array.from(generateUniqueIds(totalEntities, 1, 1_000_000));
	return {
		staffMemberIds: allUniqueIds.slice(0, totalStaffMembers),
		studentIds: allUniqueIds.slice(totalStaffMembers, totalEntities),
	};
}

export async function writeStaffMembers(staffMemberIds: number[]): Promise<StaffMember[]> {
	console.log('Generating dummy staff member data using faker...');
	const staffMembers: StaffMember[] = [];
	for (const id of staffMemberIds) {
		staffMembers.push(await generateDummyStaffMember(id));
	}
	mkdirSync(DATA_DIR, { recursive: true });
	writeFileSync(STAFF_MEMBERS_FILE_PATH, JSON.stringify({ data: staffMembers }, null, 2), 'utf-8');
	console.log(`Generated ${staffMembers.length} staff members and saved to ${STAFF_MEMBERS_FILE_PATH}`);
	return staffMembers;
}

export async function writeStudents(studentIds: number[]): Promise<StudentBase[]> {
	console.log('Generating dummy student data using faker...');
	const students: StudentBase[] = [];
	for (const id of studentIds) {
		students.push(await generateDummyStudent(id));
	}
	writeFileSync(STUDENTS_FILE_PATH, JSON.stringify({ data: students }, null, 2), 'utf-8');
	console.log(`Generated ${students.length} students and saved to ${STUDENTS_FILE_PATH}`);
	return students;
}

export function writeAgenda(students: StudentBase[], staffMembers: StaffMember[]): void {
	console.log('Generating dummy agenda data...');
	const { agenda: agendaData } = generateAgendaData(students, staffMembers);
	writeFileSync(AGENDA_FILE_PATH, JSON.stringify(agendaData, null, 2), 'utf-8');
	console.log(`Generated agenda for ${students.length} students and saved to ${AGENDA_FILE_PATH}`);
}

export function writeReturnMeasures(students: StudentBase[], staffMembers: StaffMember[]): void {
	console.log('Generating dummy return measures data...');
	const returnMeasuresData = generateReturnMeasureData(students, staffMembers);
	writeFileSync(RETURN_MEASURES_FILE_PATH, JSON.stringify(returnMeasuresData, null, 2), 'utf-8');
	console.log(
		`Generated return measures for ${Object.keys(returnMeasuresData).length} students and saved to ${RETURN_MEASURES_FILE_PATH}`,
	);
}

export function writeAbsenceNotices(students: StudentBase[]): void {
	console.log('Generating dummy absence-notices data...');
	const absenceNoticesData = generateAbsenceNoticeData(students);
	writeFileSync(ABSENCE_NOTICES_FILE_PATH, JSON.stringify(absenceNoticesData, null, 2), 'utf-8');
	console.log(
		`Generated absence notices for ${Object.keys(absenceNoticesData).length} students and saved to ${ABSENCE_NOTICES_FILE_PATH}`,
	);
}
