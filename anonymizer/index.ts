import * as fs from 'node:fs';
import { collectFieldReplacement, type ReplacementMap, replaceStringValue } from './replacementRules';

type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

export function anonymize(json: JSONValue): JSONValue {
	const replacements: ReplacementMap = {
		stringMap: new Map(),
		numberMap: new Map(),
	};

	collectReplacements(json, replacements);

	return applyReplacements(json, replacements);
}

function collectReplacements(json: JSONValue, rep: ReplacementMap, parentKey: string = '') {
	if (parentKey.toLowerCase().includes('href')) return;

	if (Array.isArray(json)) {
		for (const el of json) {
			collectReplacements(el, rep, parentKey);
		}
		return;
	}

	if (json !== null && typeof json === 'object') {
		for (const [key, value] of Object.entries(json)) {
			collectFieldReplacement(key, value, rep);
			collectReplacements(value, rep, key);
		}
	}
}

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

	if (typeof json === 'number' && rep.numberMap.has(json)) {
		return rep.numberMap.get(json) ?? json;
	}

	if (typeof json === 'string') {
		return replaceStringValue(json, rep);
	}

	return json;
}

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
