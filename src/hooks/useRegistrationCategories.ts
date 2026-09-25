import { useMemo } from 'react';
import type { useGroupedRegistrations } from '@/hooks/useGroupedRegistrations';
import {
	ALL_REGISTRATION_CATEGORIES,
	buildRegistrationCategories,
	resolveActiveRegistrationCategory,
} from '@/lib/registrationCategories';

type GroupedRegistrations = ReturnType<typeof useGroupedRegistrations>;

export function useRegistrationCategories(grouped: GroupedRegistrations, category: string) {
	const categories = useMemo(() => buildRegistrationCategories(grouped.orderedReasons, grouped.byReason), [grouped]);

	const activeCategory = resolveActiveRegistrationCategory(categories, category);
	const visibleReasons =
		activeCategory === ALL_REGISTRATION_CATEGORIES
			? grouped.orderedReasons
			: grouped.orderedReasons.filter((reason) => reason.key === activeCategory);

	return { categories, activeCategory, visibleReasons };
}
