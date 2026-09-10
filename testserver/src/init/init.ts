import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { faker } from '@faker-js/faker';
import type { Locker, LockersResponse } from '@/magister/response/locker.types';
import type { StaffMember } from '@/magister/response/staffmember.types';
import type { StudentBase } from '@/magister/response/student.types';
import { generateAbsenceNoticeData } from './absence-notices';
import { generateAgendaData } from './agenda';
import { generateDummyLocker } from './locker';
import { generateReturnMeasureData } from './returnMeasures';
import { ALL_PHOTOS_DIR, DATA_DIR } from './shared';
import { generateDummyStaffMember } from './staffMember';
import { generateDummyStudent } from './student';

const STAFF_MEMBERS_FILE_PATH = join(DATA_DIR, 'staff-members.json');
const STUDENTS_FILE_PATH = join(DATA_DIR, 'students.json');
const LOCKERS_FILE_PATH = join(DATA_DIR, 'lockers.json');
const AGENDA_FILE_PATH = join(DATA_DIR, 'agenda.json');
const RETURN_MEASURES_FILE_PATH = join(DATA_DIR, 'return-measures.json');
const ABSENCE_NOTICES_FILE_PATH = join(DATA_DIR, 'absence-notices.json');
const DATA_VERSION_FILE_PATH = join(DATA_DIR, 'data-version.json');

const totalStudents = 400;
const totalStaffMembers = 100;
const totalLockers = totalStudents - 30;

// Helper to generate a set of unique IDs
function generateUniqueIds(count: number, min: number, max: number): Set<number> {
	const uniqueIds = new Set<number>();
	while (uniqueIds.size < count) {
		uniqueIds.add(faker.number.int({ min, max }));
	}
	return uniqueIds;
}

async function init() {
	console.log('Clearing existing data...');
	if (existsSync(STAFF_MEMBERS_FILE_PATH)) {
		rmSync(STAFF_MEMBERS_FILE_PATH);
		console.log(`Removed ${STAFF_MEMBERS_FILE_PATH}`);
	}
	if (existsSync(STUDENTS_FILE_PATH)) {
		rmSync(STUDENTS_FILE_PATH);
		console.log(`Removed ${STUDENTS_FILE_PATH}`);
	}
	if (existsSync(LOCKERS_FILE_PATH)) {
		rmSync(LOCKERS_FILE_PATH);
		console.log(`Removed ${LOCKERS_FILE_PATH}`);
	}
	if (existsSync(AGENDA_FILE_PATH)) {
		rmSync(AGENDA_FILE_PATH);
		console.log(`Removed ${AGENDA_FILE_PATH}`);
	}
	if (existsSync(RETURN_MEASURES_FILE_PATH)) {
		rmSync(RETURN_MEASURES_FILE_PATH);
		console.log(`Removed ${RETURN_MEASURES_FILE_PATH}`);
	}
	if (existsSync(ABSENCE_NOTICES_FILE_PATH)) {
		rmSync(ABSENCE_NOTICES_FILE_PATH);
		console.log(`Removed ${ABSENCE_NOTICES_FILE_PATH}`);
	}
	if (existsSync(DATA_VERSION_FILE_PATH)) {
		rmSync(DATA_VERSION_FILE_PATH);
		console.log(`Removed ${DATA_VERSION_FILE_PATH}`);
	}
	if (existsSync(ALL_PHOTOS_DIR)) {
		rmSync(ALL_PHOTOS_DIR, { recursive: true, force: true });
		console.log(`Removed ${ALL_PHOTOS_DIR}`);
	}

	// Create ALL_PHOTOS_DIR once at the beginning
	mkdirSync(ALL_PHOTOS_DIR, { recursive: true });
	console.log(`Created directory: ${ALL_PHOTOS_DIR}`);

	// Generate a pool of unique IDs for both staff members and students
	const totalEntities = totalStudents + totalStaffMembers;
	const allUniqueIds = Array.from(generateUniqueIds(totalEntities, 1, 1_000_000));

	const staffMemberIds = allUniqueIds.slice(0, totalStaffMembers);
	const studentIds = allUniqueIds.slice(totalStaffMembers, totalEntities);

	console.log('Generating dummy staff member data using faker...');
	const staffMembers: StaffMember[] = [];
	for (const id of staffMemberIds) {
		staffMembers.push(await generateDummyStaffMember(id));
	}
	mkdirSync(DATA_DIR, { recursive: true });
	writeFileSync(STAFF_MEMBERS_FILE_PATH, JSON.stringify({ data: staffMembers }, null, 2), 'utf-8');
	console.log(`Generated ${staffMembers.length} staff members and saved to ${STAFF_MEMBERS_FILE_PATH}`);

	console.log('Generating dummy student data using faker...');
	const students: StudentBase[] = [];
	for (const id of studentIds) {
		students.push(await generateDummyStudent(id));
	}
	writeFileSync(STUDENTS_FILE_PATH, JSON.stringify({ data: students }, null, 2), 'utf-8');
	console.log(`Generated ${students.length} students and saved to ${STUDENTS_FILE_PATH}`);

	// --- Agenda Generation ---
	console.log('Generating dummy agenda data...');
	const { agenda: agendaData } = generateAgendaData(students, staffMembers);
	writeFileSync(AGENDA_FILE_PATH, JSON.stringify(agendaData, null, 2), 'utf-8');
	console.log(`Generated agenda for ${students.length} students and saved to ${AGENDA_FILE_PATH}`);

	console.log('Generating dummy return measures data...');
	const returnMeasuresData = generateReturnMeasureData(students, staffMembers);
	writeFileSync(RETURN_MEASURES_FILE_PATH, JSON.stringify(returnMeasuresData, null, 2), 'utf-8');
	console.log(
		`Generated return measures for ${Object.keys(returnMeasuresData).length} students and saved to ${RETURN_MEASURES_FILE_PATH}`,
	);

	console.log('Generating dummy absence-notices data...');
	const absenceNoticesData = generateAbsenceNoticeData(students);
	writeFileSync(ABSENCE_NOTICES_FILE_PATH, JSON.stringify(absenceNoticesData, null, 2), 'utf-8');
	console.log(
		`Generated absence notices for ${Object.keys(absenceNoticesData).length} students and saved to ${ABSENCE_NOTICES_FILE_PATH}`,
	);

	// --- Locker Generation ---
	console.log('Generating dummy locker data...');
	const lockers: Locker[] = [];

	// Determine how many lockers will have a rental period (95% of total lockers)
	const numLockersWithRentalPeriod = Math.floor(totalLockers * 0.95);

	// Determine how many students are eligible to receive a locker (95% of all students)
	const numEligibleStudents = Math.floor(students.length * 0.95);

	// Select students who will actually get a locker.
	// We need 'numLockersWithRentalPeriod' unique students.
	// Ensure we don't try to assign more lockers than eligible students.
	const studentsToAssignLockers = faker.helpers
		.shuffle([...students])
		.slice(0, Math.min(numEligibleStudents, numLockersWithRentalPeriod));

	// Keep track of assigned students to ensure one locker per student
	const assignedStudentIds = new Set<number>();
	let studentIndex = 0; // To iterate through studentsToAssignLockers

	for (let i = 0; i < totalLockers; i++) {
		let assignedStudent: StudentBase | undefined;

		// Assign a student if we still have lockers that need a rental period
		// AND we still have students available to assign
		if (i < numLockersWithRentalPeriod && studentIndex < studentsToAssignLockers.length) {
			assignedStudent = studentsToAssignLockers[studentIndex];
			assignedStudentIds.add(assignedStudent.id); // Mark student as assigned
			studentIndex++; // Move to the next student for the next locker
		}
		lockers.push(generateDummyLocker(i, assignedStudent));
	}

	const lockersResponse: LockersResponse = { lockersDetails: lockers, links: {} };

	writeFileSync(LOCKERS_FILE_PATH, JSON.stringify(lockersResponse, null, 2), 'utf-8');
	console.log(`Generated ${lockers.length} lockers and saved to ${LOCKERS_FILE_PATH}`);
	console.log(`Assigned ${assignedStudentIds.size} students to lockers.`);
	console.log(`Generated ${totalLockers - assignedStudentIds.size} lockers without rental periods.`);

	writeFileSync(DATA_VERSION_FILE_PATH, JSON.stringify({ version: Date.now().toString() }, null, 2), 'utf-8');
	console.log(`Wrote data version to ${DATA_VERSION_FILE_PATH}`);
}

init().catch(console.error);
