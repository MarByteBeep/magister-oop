'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** Sentinel value for "no category filter". */
export const ALL_CATEGORIES = 'all';

export interface RegistrationCategory {
	key: string;
	label: string;
	count: number;
}

interface RegistrationCategoryFilterProps {
	value: string;
	categories: RegistrationCategory[];
	onChange: (value: string) => void;
}

export default function RegistrationCategoryFilter({ value, categories, onChange }: RegistrationCategoryFilterProps) {
	const total = categories.reduce((sum, category) => sum + category.count, 0);

	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger aria-label="Categorie">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={ALL_CATEGORIES}>Alles ({total})</SelectItem>
				{categories.map((category) => (
					<SelectItem key={category.key} value={category.key}>
						{category.label} ({category.count})
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
