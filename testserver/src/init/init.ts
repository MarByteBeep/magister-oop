import { clearExistingData } from './clearData';
import {
	allocateEntityIds,
	writeAbsenceNotices,
	writeAgenda,
	writeReturnMeasures,
	writeStaffMembers,
	writeStudents,
} from './generateEntities';
import { writeLockers } from './generateLockers';

const totalStudents = 400;
const totalStaffMembers = 100;
const totalLockers = totalStudents - 30;

async function init() {
	clearExistingData();

	const { staffMemberIds, studentIds } = allocateEntityIds(totalStaffMembers, totalStudents);
	const staffMembers = await writeStaffMembers(staffMemberIds);
	const students = await writeStudents(studentIds);

	writeAgenda(students, staffMembers);
	writeReturnMeasures(students, staffMembers);
	writeAbsenceNotices(students);
	writeLockers(students, totalLockers);
}

init().catch(console.error);
