import { fakerNL as faker } from '@faker-js/faker';
import type { StaffMember } from '@/magister/response/staffmember.types';
import { downloadEntityPhoto } from './shared';

export async function generateDummyMedewerker(id: number): Promise<StaffMember> {
	faker.seed(id);

	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();
	const phone = faker.helpers.replaceSymbols('06-########');
	const email = faker.internet.email({ firstName, lastName });

	const hasPhoto = Math.random() > 0.05;

	let photoHref: string | undefined;
	if (hasPhoto) {
		const fakerImageUrl = faker.image.urlLoremFlickr({ category: 'people', width: 192, height: 192 });
		photoHref = await downloadEntityPhoto(id, fakerImageUrl, `/api/medewerkers/${id}/foto`);
	}

	return {
		id: id,
		voorletters: firstName.charAt(0),
		roepnaam: firstName,
		tussenvoegsel: '',
		code: faker.string.alpha({ length: 3, casing: 'upper' }),
		achternaam: lastName,
		emailadres: email,
		telefoonnummer: phone,
		links: {
			self: {
				href: `/api/medewerkers/${id}`,
			},
			...(photoHref && {
				foto: {
					href: photoHref,
				},
			}),
		},
	};
}
