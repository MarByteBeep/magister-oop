type PlainObject = Record<string, unknown>;

function isObjectValue(value: unknown): value is object {
	return value !== null && typeof value === 'object';
}

function hasPlainObjectPrototype(value: object): boolean {
	const proto = Object.getPrototypeOf(value);
	if (proto === Object.prototype) return true;
	return proto === null;
}

function isPlainObject(value: unknown): value is PlainObject {
	if (!isObjectValue(value)) return false;
	return hasPlainObjectPrototype(value);
}

function mergeEntryValue(current: unknown, value: unknown): unknown {
	if (isPlainObject(current) && isPlainObject(value)) return mergePlainObjects(current, value);
	return value;
}

function mergePlainObjects(target: PlainObject, source: PlainObject): PlainObject {
	const result: PlainObject = { ...target };
	for (const [key, value] of Object.entries(source)) {
		result[key] = mergeEntryValue(result[key], value);
	}
	return result;
}

/** Deep-merges plain objects; arrays and other values from `source` replace those in `target`. */
export function mergeDeep<T>(target: T, source: Partial<T>): T {
	return mergePlainObjects(target as PlainObject, source as PlainObject) as T;
}
