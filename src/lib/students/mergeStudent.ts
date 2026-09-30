import mergeOriginal, { type Options } from 'deepmerge';

export function mergeStudent<T>(target: T, source: Partial<T>, options?: Options): T {
	return mergeOriginal(target, source, { arrayMerge: (_, sourceArray) => sourceArray, ...options });
}
