import { join } from 'node:path';
import { fakerNL as faker } from '@faker-js/faker';
import type { StaffMember } from '@/magister/response/staffmember.types';
import { ALL_PHOTOS_DIR } from './init';

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

		const photoFileName = `${id}.jpg`;
		const photoFilePath = join(ALL_PHOTOS_DIR, photoFileName);

		try {
			const response = await fetch(fakerImageUrl);
			if (response.ok && response.body) {
				const imageBuffer = await response.arrayBuffer();
				await Bun.write(photoFilePath, imageBuffer);
				photoHref = `/api/medewerkers/${id}/foto`;
			} else {
				console.warn(`Failed to download image for ID ${id} from ${fakerImageUrl}: ${response.statusText}`);
			}
		} catch (error) {
			console.error(`Error downloading image for ID ${id}:`, error);
		}
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
