import { writeFileSync } from 'node:fs';
import { faker } from '@faker-js/faker';
import type { Locker, LockersResponse } from '@/magister/response/locker.types';
import type { StudentBase } from '@/magister/response/student.types';
import { generateDummyLocker } from './locker';
import { LOCKERS_FILE_PATH } from './paths';

function selectStudentsForLockers(
	students: StudentBase[],
	numEligibleStudents: number,
	numLockersWithRentalPeriod: number,
): StudentBase[] {
	return faker.helpers.shuffle([...students]).slice(0, Math.min(numEligibleStudents, numLockersWithRentalPeriod));
}

function nextAssignedStudent(
	studentsToAssign: StudentBase[],
	lockerIndex: number,
	numLockersWithRentalPeriod: number,
	studentIndex: number,
): { student: StudentBase | undefined; nextIndex: number } {
	if (lockerIndex >= numLockersWithRentalPeriod) {
		return { student: undefined, nextIndex: studentIndex };
	}
	if (studentIndex >= studentsToAssign.length) {
		return { student: undefined, nextIndex: studentIndex };
	}
	return { student: studentsToAssign[studentIndex], nextIndex: studentIndex + 1 };
}

function buildLockers(
	totalLockers: number,
	numLockersWithRentalPeriod: number,
	studentsToAssign: StudentBase[],
): { lockers: Locker[]; assignedCount: number } {
	const lockers: Locker[] = [];
	const assignedStudentIds = new Set<number>();
	let studentIndex = 0;

	for (let i = 0; i < totalLockers; i++) {
		const assigned = nextAssignedStudent(studentsToAssign, i, numLockersWithRentalPeriod, studentIndex);
		studentIndex = assigned.nextIndex;
		if (assigned.student) assignedStudentIds.add(assigned.student.id);
		lockers.push(generateDummyLocker(i, assigned.student));
	}

	return { lockers, assignedCount: assignedStudentIds.size };
}

export function writeLockers(students: StudentBase[], totalLockers: number): void {
	console.log('Generating dummy locker data...');
	const numLockersWithRentalPeriod = Math.floor(totalLockers * 0.95);
	const numEligibleStudents = Math.floor(students.length * 0.95);
	const studentsToAssign = selectStudentsForLockers(students, numEligibleStudents, numLockersWithRentalPeriod);
	const { lockers, assignedCount } = buildLockers(totalLockers, numLockersWithRentalPeriod, studentsToAssign);

	const lockersResponse: LockersResponse = {
		lockersDetails: lockers,
		links: {},
	};

	writeFileSync(LOCKERS_FILE_PATH, JSON.stringify(lockersResponse, null, 2), 'utf-8');
	console.log(`Generated ${lockers.length} lockers and saved to ${LOCKERS_FILE_PATH}`);
	console.log(`Assigned ${assignedCount} students to lockers.`);
	console.log(`Generated ${totalLockers - assignedCount} lockers without rental periods.`);
}
