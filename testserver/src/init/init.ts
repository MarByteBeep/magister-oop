import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { faker } from '@faker-js/faker';
import type { Locker, LockersResponse } from '@/magister/response/locker.types';
import type { StaffMember } from '@/magister/response/staffmember.types';
import type { Student } from '@/magister/response/student.types';
import { generateAgendaData } from './agenda';
import { generateDummyLeerling } from './leerling';
import { generateDummyLocker } from './locker';
import { generateDummyMedewerker } from './medewerker';

const DATA_DIR = join(import.meta.dir, '../../data');

const MEDEWERKERS_FILE_PATH = join(DATA_DIR, 'medewerkers.json');
const LEERLINGEN_FILE_PATH = join(DATA_DIR, 'leerlingen.json');
const LOCKERS_FILE_PATH = join(DATA_DIR, 'lockers.json');
const AGENDA_FILE_PATH = join(DATA_DIR, 'agenda.json');
export const ALL_PHOTOS_DIR = join(DATA_DIR, 'all_photos');

const totalLeerlingen = 400;
const totalMedewerkers = 100;
const totalLockers = totalLeerlingen - 30;

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
	if (existsSync(MEDEWERKERS_FILE_PATH)) {
		rmSync(MEDEWERKERS_FILE_PATH);
		console.log(`Removed ${MEDEWERKERS_FILE_PATH}`);
	}
	if (existsSync(LEERLINGEN_FILE_PATH)) {
		rmSync(LEERLINGEN_FILE_PATH);
		console.log(`Removed ${LEERLINGEN_FILE_PATH}`);
	}
	if (existsSync(LOCKERS_FILE_PATH)) {
		rmSync(LOCKERS_FILE_PATH);
		console.log(`Removed ${LOCKERS_FILE_PATH}`);
	}
	if (existsSync(AGENDA_FILE_PATH)) {
		rmSync(AGENDA_FILE_PATH);
		console.log(`Removed ${AGENDA_FILE_PATH}`);
	}
	if (existsSync(ALL_PHOTOS_DIR)) {
		rmSync(ALL_PHOTOS_DIR, { recursive: true, force: true });
		console.log(`Removed ${ALL_PHOTOS_DIR}`);
	}

	// Create ALL_PHOTOS_DIR once at the beginning
	mkdirSync(ALL_PHOTOS_DIR, { recursive: true });
	console.log(`Created directory: ${ALL_PHOTOS_DIR}`);

	// Generate a pool of unique IDs for both medewerkers and leerlingen
	const totalEntities = totalLeerlingen + totalMedewerkers;
	const allUniqueIds = Array.from(generateUniqueIds(totalEntities, 1, 1_000_000));

	const medewerkerIds = allUniqueIds.slice(0, totalMedewerkers);
	const leerlingIds = allUniqueIds.slice(totalMedewerkers, totalEntities);

	console.log('Generating dummy medewerker data using faker...');
	const medewerkers: StaffMember[] = [];
	for (const id of medewerkerIds) {
		medewerkers.push(await generateDummyMedewerker(id));
	}
	mkdirSync(DATA_DIR, { recursive: true });
	writeFileSync(MEDEWERKERS_FILE_PATH, JSON.stringify({ data: medewerkers }, null, 2), 'utf-8');
	console.log(`Generated ${medewerkers.length} medewerkers and saved to ${MEDEWERKERS_FILE_PATH}`);

	console.log('Generating dummy leerling data using faker...');
	const leerlingen: Student[] = [];
	for (const id of leerlingIds) {
		leerlingen.push(await generateDummyLeerling(id));
	}
	writeFileSync(LEERLINGEN_FILE_PATH, JSON.stringify({ data: leerlingen }, null, 2), 'utf-8');
	console.log(`Generated ${leerlingen.length} leerlingen and saved to ${LEERLINGEN_FILE_PATH}`);

	// --- Agenda Generation ---
	console.log('Generating dummy agenda data...');
	const agendaData = generateAgendaData(leerlingen, medewerkers);
	writeFileSync(AGENDA_FILE_PATH, JSON.stringify(agendaData, null, 2), 'utf-8');
	console.log(`Generated agenda for ${leerlingen.length} students and saved to ${AGENDA_FILE_PATH}`);

	// --- Locker Generation ---
	console.log('Generating dummy locker data...');
	const lockers: Locker[] = [];

	// Determine how many lockers will have a rental period (95% of total lockers)
	const numLockersWithRentalPeriod = Math.floor(totalLockers * 0.95);

	// Determine how many students are eligible to receive a locker (95% of all students)
	const numEligibleStudents = Math.floor(leerlingen.length * 0.95);

	// Select students who will actually get a locker.
	// We need 'numLockersWithRentalPeriod' unique students.
	// Ensure we don't try to assign more lockers than eligible students.
	const studentsToAssignLockers = faker.helpers
		.shuffle([...leerlingen])
		.slice(0, Math.min(numEligibleStudents, numLockersWithRentalPeriod));

	// Keep track of assigned students to ensure one locker per student
	const assignedStudentIds = new Set<number>();
	let studentIndex = 0; // To iterate through studentsToAssignLockers

	for (let i = 0; i < totalLockers; i++) {
		let assignedStudent: Student | undefined;

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
}

init().catch(console.error);
