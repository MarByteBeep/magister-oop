import { fakerEN as faker } from '@faker-js/faker';

const DASHED_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Magister's platform URLs address entities by the same UUID without dashes. */
const COMPACT_UUID_PATTERN = /^[0-9a-f]{32}$/i;
const DASHED_UUID_SCAN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
/** Id-shaped token inside a string: dashed UUID, compact UUID, or a digit run. */
const ID_TOKEN_SCAN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{32}|[0-9]+/gi;
const URL_PATTERN = /^(\/|https?:\/\/)/i;
const NUMERIC_SEGMENT_PATTERN = /^[1-9][0-9]*$/;
const DATE_OR_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}([T ].*)?$|^\d{1,2}:\d{2}(:\d{2})?$/;

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
	if (!rep.stringMap.has(value)) {
		rep.stringMap.set(value, replacement);
	}
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

function isUuidLike(value: string) {
	return DASHED_UUID_PATTERN.test(value) || COMPACT_UUID_PATTERN.test(value);
}

function toDashedUuid(compact: string) {
	const hex = compact.toLowerCase();
	return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}

/** Registers both notations so a URL and a JSON body resolve to the same new UUID. */
function mapUuid(rep: ReplacementMap, value: string) {
	const dashed = (DASHED_UUID_PATTERN.test(value) ? value : toDashedUuid(value)).toLowerCase();
	if (rep.stringMap.has(dashed)) return;

	const replacement = faker.string.uuid();
	rep.stringMap.set(dashed, replacement);
	rep.stringMap.set(dashed.replace(/-/g, ''), replacement.replace(/-/g, ''));
}

function pathOf(url: string) {
	const queryStart = url.search(/[?#]/);
	return queryStart === -1 ? url : url.slice(0, queryStart);
}

/** Ids that exist nowhere else in the payload: `/api/leerlingen/13511/foto`. */
function collectUrlIds(url: string, rep: ReplacementMap) {
	for (const segment of pathOf(url).split('/')) {
		if (NUMERIC_SEGMENT_PATTERN.test(segment)) {
			mapNumber(rep, Number(segment));
		} else if (isUuidLike(segment)) {
			mapUuid(rep, segment);
		}
	}
}

const FIELD_RULES: FieldRule[] = [
	{
		matches: (key, value) =>
			keyIncludes(
				key,
				'comment',
				'omschrijving',
				'desc',
				'description',
				'titel',
				'title',
				'onderwerp',
				'subject',
				'reason',
				'reden',
				'tekst',
				'text',
			) &&
			typeof value === 'string' &&
			value.length > 0,
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
		apply: (value, rep) => mapString(rep, value as string, faker.helpers.arrayElement(['de', 'von', 'st', 'le'])),
	},
	{
		matches: (key, value) => keyIncludes(key, 'email', 'mail') && typeof value === 'string' && value.includes('@'),
		apply: (value, rep) => mapString(rep, value as string, faker.internet.email()),
	},
	{
		// Phone numbers come in too many shapes (+31, spaces, parentheses) to
		// rewrite digit by digit, so the whole value is thrown away.
		matches: (key, value) =>
			keyIncludes(key, 'telefoon', 'phone', 'mobiel') && typeof value === 'string' && value.length > 0,
		apply: (value, rep) => mapString(rep, value as string, faker.phone.number()),
	},
	{
		matches: (key, value) => keyIncludes(key, 'id') && typeof value === 'string' && isUuidLike(value),
		apply: (value, rep) => mapUuid(rep, value as string),
	},
	{
		matches: (key, value) => keyIncludes(key, 'id') && typeof value === 'number',
		apply: (value, rep) => mapNumber(rep, value as number),
	},
	{
		matches: (key, value) => keyIncludes(key, 'number', 'nummer') && typeof value === 'number',
		apply: (value, rep) => mapNumber(rep, value as number),
	},
	{
		// Ids kept as text: "stamnummer": "51155", "code": "537457".
		matches: (key, value) =>
			keyIncludes(key, 'id', 'number', 'nummer', 'code') &&
			!keyIncludes(key, 'telefoon', 'phone', 'mobiel') &&
			typeof value === 'string' &&
			NUMERIC_SEGMENT_PATTERN.test(value),
		apply: (value, rep) => mapNumber(rep, Number(value)),
	},
	{
		matches: (_key, value) => typeof value === 'string' && URL_PATTERN.test(value),
		apply: (value, rep) => collectUrlIds(value as string, rep),
	},
	{
		matches: (_key, value) => typeof value === 'string' && value.includes('-'),
		apply: (value, rep) => {
			for (const match of (value as string).matchAll(DASHED_UUID_SCAN)) {
				mapUuid(rep, match[0]);
			}
		},
	},
];

export function collectFieldReplacement(key: string, value: unknown, rep: ReplacementMap) {
	for (const rule of FIELD_RULES) {
		if (rule.matches(key, value)) {
			rule.apply(value, rep);
		}
	}
}

function replaceIdToken(token: string, rep: ReplacementMap): string {
	if (!/^[0-9]+$/.test(token)) {
		return rep.stringMap.get(token.toLowerCase()) ?? token;
	}

	const numeric = Number(token);
	// Leading zeros mark a formatted fragment (lesson hour, time), never an id.
	if (String(numeric) !== token) return token;

	const replacement = rep.numberMap.get(numeric);
	return replacement == null ? token : String(replacement);
}

/** Single pass, so a replacement value can never be rewritten again by a later mapping. */
function replaceIdTokens(value: string, rep: ReplacementMap): string {
	return value.replace(ID_TOKEN_SCAN, (token) => replaceIdToken(token, rep));
}

export function replaceStringValue(value: string, rep: ReplacementMap): string {
	const mapped = rep.stringMap.get(value);
	if (mapped != null) return mapped;

	if (URL_PATTERN.test(value)) {
		// Query strings hold dates and paging values; only the path carries ids.
		const path = pathOf(value);
		return replaceIdTokens(path, rep) + value.slice(path.length);
	}

	// Digits inside a timestamp are not ids; rewriting them would break the date.
	if (DATE_OR_TIME_PATTERN.test(value)) return value;

	return replaceIdTokens(value, rep);
}
