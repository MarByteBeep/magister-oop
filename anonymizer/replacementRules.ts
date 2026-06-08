import { faker } from '@faker-js/faker';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ReplacementMap = {
	stringMap: Map<string, string>;
	numberMap: Map<number, number>;
};

type FieldRule = {
	matches: (key: string, value: unknown) => boolean;
	apply: (value: unknown, rep: ReplacementMap) => void;
};

function randomNumberWithDigits(n: number): number {
	const digits = n.toString().length;
	const min = 10 ** (digits - 1);
	const max = 10 ** digits - 1;
	return faker.number.int({ min, max });
}

function mapString(rep: ReplacementMap, value: string, replacement: string) {
	rep.stringMap.set(value, replacement);
}

function mapNumber(rep: ReplacementMap, value: number) {
	if (!rep.numberMap.has(value)) {
		rep.numberMap.set(value, randomNumberWithDigits(value));
	}
}

function keyIncludes(key: string, ...parts: string[]) {
	const lower = key.toLowerCase();
	return parts.some((part) => lower.includes(part));
}

const FIELD_RULES: FieldRule[] = [
	{
		matches: (key, value) => keyIncludes(key, 'comment', 'omschrijving') && typeof value === 'string',
		apply: (value, rep) => mapString(rep, value as string, faker.lorem.sentence()),
	},
	{
		matches: (key, value) => keyIncludes(key, 'firstname', 'voornaam', 'roepnaam') && typeof value === 'string',
		apply: (value, rep) => mapString(rep, value as string, faker.person.firstName()),
	},
	{
		matches: (key, value) => keyIncludes(key, 'lastname', 'achternaam') && typeof value === 'string',
		apply: (value, rep) => mapString(rep, value as string, faker.person.lastName()),
	},
	{
		matches: (key, value) => keyIncludes(key, 'initials', 'initialen', 'voorletters') && typeof value === 'string',
		apply: (value, rep) => mapString(rep, value as string, faker.string.alpha({ casing: 'upper', length: 2 })),
	},
	{
		matches: (key, value) => {
			const lower = key.toLowerCase();
			return (
				(lower === 'infix' || lower.includes('tussenvoegsel')) && typeof value === 'string' && value.length > 0
			);
		},
		apply: (value, rep) =>
			mapString(rep, value as string, faker.helpers.arrayElement(['van', 'van de', 'de', 'ten', 'van der'])),
	},
	{
		matches: (key, value) => keyIncludes(key, 'id') && typeof value === 'string' && uuidRegex.test(value),
		apply: (value, rep) => {
			const str = value as string;
			if (!rep.stringMap.has(str)) {
				rep.stringMap.set(str, faker.string.uuid());
			}
		},
	},
	{
		matches: (key, value) => keyIncludes(key, 'id') && typeof value === 'number',
		apply: (value, rep) => mapNumber(rep, value as number),
	},
	{
		matches: (key, value) => keyIncludes(key, 'number') && typeof value === 'number',
		apply: (value, rep) => mapNumber(rep, value as number),
	},
];

export function collectFieldReplacement(key: string, value: unknown, rep: ReplacementMap) {
	for (const rule of FIELD_RULES) {
		if (rule.matches(key, value)) {
			rule.apply(value, rep);
		}
	}
}

export function replaceStringValue(value: string, rep: ReplacementMap): string {
	if (rep.stringMap.has(value)) {
		return rep.stringMap.get(value) ?? value;
	}

	let result = value;
	for (const [oldStr, newStr] of rep.stringMap.entries()) {
		if (uuidRegex.test(oldStr)) {
			result = result.split(oldStr).join(newStr);
		}
	}

	for (const [oldNum, newNum] of rep.numberMap.entries()) {
		result = result.split(String(oldNum)).join(String(newNum));
	}

	return result;
}
