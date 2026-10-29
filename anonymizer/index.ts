import * as fs from 'node:fs';
import path from 'node:path';
import { applyReplacements, collectReplacements, type JSONValue } from './jsonReplacements';
import type { ReplacementMap } from './replacementRules';

export type { JSONValue } from './jsonReplacements';

export function anonymize(json: JSONValue): JSONValue {
	const replacements: ReplacementMap = {
		stringMap: new Map(),
		numberMap: new Map(),
	};

	collectReplacements(json, replacements);

	return applyReplacements(json, replacements);
}

function overwriteJsonFile(sourcePath: string, output: string): void {
	const tempPath = `${sourcePath}.${process.pid}.tmp`;
	try {
		fs.writeFileSync(tempPath, output, 'utf8');
		fs.renameSync(tempPath, sourcePath);
	} catch (error) {
		fs.rmSync(tempPath, { force: true });
		throw error;
	}
}

if (import.meta.main) {
	const source = process.argv[2];
	if (!source) {
		console.error('Usage: bun anon <source.json>');
		process.exit(1);
	}

	const sourcePath = path.resolve(source);
	const raw = fs.readFileSync(sourcePath, 'utf8');
	const json = JSON.parse(raw);
	const output = `${JSON.stringify(anonymize(json), null, 4)}\n`;
	overwriteJsonFile(sourcePath, output);

	console.error(`Anonymized and overwrote ${sourcePath}`);
}
