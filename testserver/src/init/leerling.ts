import { fakerNL as faker } from '@faker-js/faker';
import type { StudentBase } from '@/magister/response/student.types';
import { downloadEntityPhoto } from './shared';

export async function generateDummyLeerling(id: number): Promise<StudentBase> {
	faker.seed(id);

	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();
	const phone = faker.helpers.replaceSymbols('06-########');
	const code = faker.string.numeric({ length: 6 });
	const email = `${code}@edu.somedomain.nl`;
	const externeId = faker.string.uuid();

	const klassenOptions: StudentBase['klassen'][number][] = [
		'1B1',
		'1K1',
		'1K2',
		'1T1',
		'1T2',
		'2B1',
		'2K1',
		'2KB1',
		'2T1',
		'2T2',
		'3B1',
		'3K1',
		'3K2',
		'3K3',
		'3T1',
		'3T2',
		'4B1',
		'4K1',
		'4K2',
		'4LWT1',
		'4T1',
		'4T2',
	];
	const studiesOptions: StudentBase['studies'][number][] = [
		'1B',
		'1K',
		'1T',
		'2B',
		'2K',
		'2KB',
		'2T',
		'3B',
		'3K',
		'3T',
		'4B',
		'4K',
		'4LWT',
		'4T',
	];

	const tStudies = studiesOptions.filter((s) => s.endsWith('T'));
	const nonTStudies = studiesOptions.filter((s) => !s.endsWith('T'));

	let studies: StudentBase['studies'];
	if (Math.random() < 0.8 && tStudies.length > 0) {
		studies = faker.helpers.arrayElements(tStudies, { min: 1, max: 1 });
	} else if (nonTStudies.length > 0) {
		studies = faker.helpers.arrayElements(nonTStudies, { min: 1, max: 1 });
	} else {
		studies = faker.helpers.arrayElements(studiesOptions, { min: 1, max: 1 });
	}

	const chosenStudy = studies[0];
	const studyYear = chosenStudy.charAt(0);
	const studyType = chosenStudy.substring(1);

	const matchingKlassen = klassenOptions.filter((klas) => klas.startsWith(studyYear) && klas.includes(studyType));

	const klassen =
		matchingKlassen.length > 0
			? [faker.helpers.arrayElement(matchingKlassen)]
			: [faker.helpers.arrayElement(klassenOptions)];

	const hasPhoto = Math.random() > 0.05;

	let photoHref: string | undefined;
	if (hasPhoto) {
		const fakerImageUrl = faker.image.urlLoremFlickr({ category: 'cat', width: 192, height: 192 });
		photoHref = await downloadEntityPhoto(id, fakerImageUrl, `/api/leerlingen/${id}/foto`);
	}

	return {
		id: id,
		voorletters: firstName.charAt(0),
		roepnaam: firstName,
		tussenvoegsel: '',
		achternaam: lastName,
		code: code,
		emailadres: email,
		lesgroepen: [],
		telefoonnummer: phone,
		klassen: klassen,
		studies: studies,
		externeId: externeId,
		links: {
			self: {
				href: `/api/leerlingen/${id}`,
			},
			...(photoHref && {
				foto: {
					href: photoHref,
				},
			}),
		},
	};
}
