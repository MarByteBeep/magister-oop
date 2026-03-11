import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function groupBy<T, K extends string | number | symbol>(items: T[], getKey: (item: T) => K): Record<K, T[]> {
	const result = {} as Record<K, T[]>;

	for (const item of items) {
		const key = getKey(item);

		if (!result[key]) {
			result[key] = [];
		}

		result[key].push(item);
	}

	return result;
}
