type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
	if (value === null || typeof value !== 'object') return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

function mergePlainObjects(target: PlainObject, source: PlainObject): PlainObject {
	const result: PlainObject = { ...target };
	for (const [key, value] of Object.entries(source)) {
		const current = result[key];
		result[key] = isPlainObject(current) && isPlainObject(value) ? mergePlainObjects(current, value) : value;
	}
	return result;
}

/** Deep-merges plain objects; arrays and other values from `source` replace those in `target`. */
export function mergeDeep<T>(target: T, source: Partial<T>): T {
	return mergePlainObjects(target as PlainObject, source as PlainObject) as T;
}
