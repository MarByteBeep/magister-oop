import { fakerNL as faker } from '@faker-js/faker';
import type { StudentBase } from '@/magister/response/student.types';
import { generateEntityLinks } from './shared';

const CLASS_OPTIONS: StudentBase['klassen'][number][] = [
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

const STUDIES_OPTIONS: StudentBase['studies'][number][] = [
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

function pickTStudies(tStudies: StudentBase['studies'][number][]): StudentBase['studies'] | null {
	if (Math.random() >= 0.8) return null;
	if (tStudies.length === 0) return null;
	return faker.helpers.arrayElements(tStudies, { min: 1, max: 1 });
}

function pickStudies(): StudentBase['studies'] {
	const tStudies = STUDIES_OPTIONS.filter((s) => s.endsWith('T'));
	const nonTStudies = STUDIES_OPTIONS.filter((s) => !s.endsWith('T'));
	const fromT = pickTStudies(tStudies);
	if (fromT) return fromT;
	if (nonTStudies.length > 0) {
		return faker.helpers.arrayElements(nonTStudies, { min: 1, max: 1 });
	}
	return faker.helpers.arrayElements(STUDIES_OPTIONS, { min: 1, max: 1 });
}

function matchingClassesForStudy(chosenStudy: string): StudentBase['klassen'][number][] {
	const studyYear = chosenStudy.charAt(0);
	const studyType = chosenStudy.substring(1);
	return CLASS_OPTIONS.filter((classCode) => classCode.startsWith(studyYear) && classCode.includes(studyType));
}

function pickClasses(chosenStudy: string): StudentBase['klassen'] {
	const matchingClasses = matchingClassesForStudy(chosenStudy);
	if (matchingClasses.length > 0) {
		return [faker.helpers.arrayElement(matchingClasses)];
	}
	return [faker.helpers.arrayElement(CLASS_OPTIONS)];
}

export async function generateDummyStudent(id: number): Promise<StudentBase> {
	faker.seed(id);

	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();
	const code = faker.string.numeric({ length: 6 });
	const studies = pickStudies();
	const links = await generateEntityLinks(id, `/api/leerlingen/${id}`);

	return {
		id,
		voorletters: firstName.charAt(0),
		roepnaam: firstName,
		tussenvoegsel: '',
		achternaam: lastName,
		code,
		emailadres: `${code}@edu.somedomain.nl`,
		lesgroepen: [],
		telefoonnummer: faker.helpers.replaceSymbols('06-########'),
		klassen: pickClasses(studies[0]),
		studies,
		externeId: faker.string.uuid(),
		links,
	};
}
