/** Sentinel value for "no category filter" (Select item + filter state). */
export const ALL_REGISTRATION_CATEGORIES = 'all';

export interface RegistrationCategoryOption {
	key: string;
	label: string;
	count: number;
}

export function buildRegistrationCategories(
	orderedReasons: Array<{ key: string; label: string }>,
	byReason: Map<string, unknown[]>,
): RegistrationCategoryOption[] {
	return orderedReasons.map(({ key, label }) => ({
		key,
		label,
		count: byReason.get(key)?.length ?? 0,
	}));
}

export function resolveActiveRegistrationCategory(categories: RegistrationCategoryOption[], category: string): string {
	return categories.some((c) => c.key === category) ? category : ALL_REGISTRATION_CATEGORIES;
}
