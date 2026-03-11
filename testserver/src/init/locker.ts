import { faker } from '@faker-js/faker';
import type { Locker } from '@/magister/response/locker.types';
import type { Student } from '@/magister/response/student.types';

export function generateDummyLocker(
	lockerIndex: number, // Use an index to generate sequential locker codes
	assignedStudent?: Student,
): Locker {
	faker.seed(lockerIndex); // Seed for consistent locker properties based on index

	const lockerId = faker.string.uuid();
	const unitId = faker.string.uuid();
	const lockerTypeTitle = faker.helpers.arrayElement(['Standaard Locker', 'Grote Locker', 'Kleine Locker']);
	const clusterId = faker.string.uuid();
	const clusterTitle = faker.helpers.arrayElement(['Hoofdgebouw A', 'Hoofdgebouw B', 'Bijgebouw C']);
	const lockCode = faker.string.numeric({ length: 4 });

	// Format lockerCode as "001", "002", etc.
	const lockerCode = String(lockerIndex + 1).padStart(3, '0');

	let rentalPeriod: Locker['rentalPeriod'] | undefined;

	if (assignedStudent) {
		const startDate = faker.date.past({ years: 1 }).toISOString().split('T')[0];
		const endDate = faker.date.future({ years: 1 }).toISOString().split('T')[0];
		const rent = faker.number.float({ min: 10, max: 50, multipleOf: 0.01 });
		const deposit = faker.number.float({ min: 5, max: 20, multipleOf: 0.01 });

		rentalPeriod = {
			id: faker.string.uuid(),
			startDate: startDate,
			endDate: endDate,
			rent: rent,
			deposit: deposit,
			keyState: 'handedOut',
			student: {
				id: assignedStudent.externeId, // Matches Leerling.externeId
				firstName: assignedStudent.roepnaam,
				familyName: assignedStudent.achternaam,
				studentNumber: parseInt(assignedStudent.code, 10), // Matches Leerling.code
				personId: assignedStudent.id, // Matches Leerling.id
				group: assignedStudent.klassen.join(', '),
				study: assignedStudent.studies.join(', '),
				hasPhoto: !!assignedStudent.links.foto,
				hasActiveStudy: true, // Assuming active for dummy data
			},
			links: {},
		};
	}

	return {
		id: lockerId,
		lockerId: lockerId,
		unitId: unitId,
		lockerTypeTitle: lockerTypeTitle,
		cluster: {
			id: clusterId,
			title: clusterTitle,
		},
		clusterTitle: clusterTitle,
		lockerCode: lockerCode,
		keyCode: lockerCode,
		lockCode: lockCode,
		rentalPeriod: rentalPeriod,
		links: {
			rentalPeriods: {
				href: `/api/v1/locker/${lockerId}/rentalperiods`,
				method: 'GET',
			},
		},
	};
}
