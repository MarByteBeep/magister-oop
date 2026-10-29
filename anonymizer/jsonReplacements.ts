import { collectFieldReplacement, type ReplacementMap, replaceStringValue } from './replacementRules';

export type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

function isJsonObject(json: JSONValue): json is { [key: string]: JSONValue } {
	return json !== null && typeof json === 'object';
}

function collectArrayReplacements(json: JSONValue[], rep: ReplacementMap, parentKey: string): void {
	for (const el of json) {
		// Items inherit their parent key so id lists like
		// "organisatorPersoonIds": [391] are collected as well.
		collectFieldReplacement(parentKey, el, rep);
		collectReplacements(el, rep, parentKey);
	}
}

function collectObjectReplacements(json: { [key: string]: JSONValue }, rep: ReplacementMap): void {
	for (const [key, value] of Object.entries(json)) {
		collectFieldReplacement(key, value, rep);
		collectReplacements(value, rep, key);
	}
}

export function collectReplacements(json: JSONValue, rep: ReplacementMap, parentKey = ''): void {
	if (Array.isArray(json)) {
		collectArrayReplacements(json, rep, parentKey);
		return;
	}
	if (isJsonObject(json)) {
		collectObjectReplacements(json, rep);
	}
}

function applyObjectReplacements(
	json: { [key: string]: JSONValue },
	rep: ReplacementMap,
): { [key: string]: JSONValue } {
	const out: { [key: string]: JSONValue } = {};
	for (const [key, value] of Object.entries(json)) {
		out[key] = applyReplacements(value, rep);
	}
	return out;
}

function applyNumberReplacement(value: number, rep: ReplacementMap): number {
	const mapped = rep.numberMap.get(value);
	if (mapped === undefined) return value;
	return mapped;
}

function applyScalarReplacement(json: JSONValue, rep: ReplacementMap): JSONValue {
	if (typeof json === 'number') return applyNumberReplacement(json, rep);
	if (typeof json === 'string') return replaceStringValue(json, rep);
	return json;
}

export function applyReplacements(json: JSONValue, rep: ReplacementMap): JSONValue {
	if (Array.isArray(json)) {
		return json.map((el) => applyReplacements(el, rep));
	}
	if (isJsonObject(json)) {
		return applyObjectReplacements(json, rep);
	}
	return applyScalarReplacement(json, rep);
}
