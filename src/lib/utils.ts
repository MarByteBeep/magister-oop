import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Student } from '@/magister/types';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function deepEqual<T>(a: T, b: T): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
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

export function sortAndGroupStudentsByClass(students: Student[]): Record<string, Student[]> {
	const sorted = [...students].sort((a, b) => a.roepnaam.localeCompare(b.roepnaam));
	return groupBy(sorted, (student) => student.klassen.join(', '));
}
