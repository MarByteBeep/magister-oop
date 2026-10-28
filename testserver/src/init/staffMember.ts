import { fakerNL as faker } from '@faker-js/faker';
import type { StaffMember } from '@/magister/response/staffMember.types';
import { generateEntityLinks } from './shared';

export async function generateDummyStaffMember(id: number): Promise<StaffMember> {
	faker.seed(id);

	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();
	const phone = faker.helpers.replaceSymbols('06-########');
	const email = faker.internet.email({ firstName, lastName });

	const links = await generateEntityLinks(id, `/api/medewerkers/${id}`);

	return {
		id: id,
		voorletters: firstName.charAt(0),
		roepnaam: firstName,
		tussenvoegsel: '',
		code: faker.string.alpha({ length: 3, casing: 'upper' }),
		achternaam: lastName,
		emailadres: email,
		telefoonnummer: phone,
		links,
	};
}
