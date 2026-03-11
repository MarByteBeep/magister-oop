import * as fs from 'node:fs';
import { faker } from '@faker-js/faker';

type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ReplacementMap {
	stringMap: Map<string, string>;
	numberMap: Map<number, number>;
}

function randomNumberWithDigits(n: number): number {
	const digits = n.toString().length;
	const min = 10 ** (digits - 1);
	const max = 10 ** digits - 1;
	return faker.number.int({ min, max });
}

export function anonymize(json: JSONValue): JSONValue {
	const replacements: ReplacementMap = {
		stringMap: new Map(),
		numberMap: new Map(),
	};

	collectReplacements(json, replacements);

	return applyReplacements(json, replacements);
}

/* -------------------------------------------
   FIRST PASS — DETECT VALUES TO REPLACE
-------------------------------------------- */
function collectReplacements(json: JSONValue, rep: ReplacementMap, parentKey: string = '') {
	// Do NOT collect replacements for values inside href
	if (parentKey.toLowerCase().includes('href')) {
		return;
	}

	if (Array.isArray(json)) {
		for (const el of json) {
			collectReplacements(el, rep, parentKey);
		}
		return;
	}

	if (json !== null && typeof json === 'object') {
		for (const [key, value] of Object.entries(json)) {
			const lower = key.toLowerCase();

			// --- comment fields ---
			if ((lower.includes('comment') || lower.includes('omschrijving')) && typeof value === 'string') {
				rep.stringMap.set(value, faker.lorem.sentence());
			}

			// --- firstname ---
			if (
				(lower.includes('firstname') || lower.includes('voornaam') || lower.includes('roepnaam')) &&
				typeof value === 'string'
			) {
				rep.stringMap.set(value, faker.person.firstName());
			}

			// --- lastname ---
			if ((lower.includes('lastname') || lower.includes('achternaam')) && typeof value === 'string') {
				rep.stringMap.set(value, faker.person.lastName());
			}

			// --- initials ---
			if (
				(lower.includes('initials') || lower.includes('initialen') || lower.includes('voorletters')) &&
				typeof value === 'string'
			) {
				rep.stringMap.set(value, faker.string.alpha({ casing: 'upper', length: 2 }));
			}

			// --- id fields (UUID) ---
			if (lower.includes('id') && typeof value === 'string' && uuidRegex.test(value)) {
				if (!rep.stringMap.has(value)) {
					rep.stringMap.set(value, faker.string.uuid());
				}
			}

			// --- id fields (numeric) ---
			if (lower.includes('id') && typeof value === 'number') {
				if (!rep.numberMap.has(value)) {
					rep.numberMap.set(value, randomNumberWithDigits(value));
				}
			}

			// --- number fields ---
			if (lower.includes('number') && typeof value === 'number') {
				if (!rep.numberMap.has(value)) {
					rep.numberMap.set(value, randomNumberWithDigits(value));
				}
			}

			collectReplacements(value, rep, key);
		}
		return;
	}
}

/* -------------------------------------------
   SECOND PASS — APPLY REPLACEMENTS
-------------------------------------------- */
function applyReplacements(json: JSONValue, rep: ReplacementMap): JSONValue {
	if (Array.isArray(json)) {
		return json.map((el) => applyReplacements(el, rep));
	}

	if (json !== null && typeof json === 'object') {
		const out: Record<string, JSONValue> = {};
		for (const [key, value] of Object.entries(json)) {
			out[key] = applyReplacements(value, rep);
		}
		return out;
	}

	// Replace numbers exactly
	if (typeof json === 'number' && rep.numberMap.has(json)) {
		return rep.numberMap.get(json) ?? json;
	}

	// Replace strings
	if (typeof json === 'string') {
		let s = json;

		// 1. Exact string replacements (names, comments)
		if (rep.stringMap.has(s)) {
			return rep.stringMap.get(s) ?? s;
		}

		// 2. Replace UUID substrings in URLs or other strings
		for (const [oldStr, newStr] of rep.stringMap.entries()) {
			if (typeof oldStr === 'string' && uuidRegex.test(oldStr)) {
				s = s.split(oldStr).join(newStr);
			}
		}

		// 3. Replace numeric ID substrings
		for (const [oldNum, newNum] of rep.numberMap.entries()) {
			s = s.split(String(oldNum)).join(String(newNum));
		}

		return s;
	}

	return json;
}

/* -------------------------------------------
   CLI ENTRY POINT
-------------------------------------------- */
if (require.main === module) {
	const file = process.argv[2];
	if (!file) {
		console.error('Gebruik: node script.js input.json');
		process.exit(1);
	}

	const raw = fs.readFileSync(file, 'utf8');
	const json = JSON.parse(raw);

	const anon = anonymize(json);
	console.log(JSON.stringify(anon, null, 4));
}
