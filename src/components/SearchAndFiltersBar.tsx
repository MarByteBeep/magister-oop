'use client';

import { useState } from 'react';
import { PermanentFiltersPanel } from '@/components/PermanentFiltersPanel';
import { QuickFiltersBar } from '@/components/QuickFiltersBar';
import { SearchInputRow } from '@/components/SearchInputRow';
import { useAutoFocus } from '@/hooks/useAutofocus';
import { useSearchTermStorage } from '@/hooks/useSearchTermStorage';

export type QuickFilterItem = {
	id: string;
	label: string;
	count?: number;
};

export type PermanentFilterOption = {
	value: string;
	label: string;
};

export interface SearchAndFiltersBarProps {
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	searchPlaceholder?: string;
	searchStorageKey?: string;
	permanentFilterTitle?: string;
	permanentFilterOptions: PermanentFilterOption[];
	selectedPermanentFilters: Set<string>;
	onSelectedPermanentFiltersChange: (value: string, checked: boolean) => void;
	quickFilters: QuickFilterItem[];
	activeQuickFilterId: string | null;
	onActiveQuickFilterIdChange: (id: string | null) => void;
	loading?: boolean;
	loadingTooltip?: string;
}

export function SearchAndFiltersBar({
	searchTerm,
	onSearchTermChange,
	searchPlaceholder = 'Zoek…',
	searchStorageKey,
	permanentFilterTitle = 'Permanente filters',
	permanentFilterOptions,
	selectedPermanentFilters,
	onSelectedPermanentFiltersChange,
	quickFilters,
	activeQuickFilterId,
	onActiveQuickFilterIdChange,
	loading = false,
	loadingTooltip,
}: SearchAndFiltersBarProps) {
	const searchInputRef = useAutoFocus<HTMLInputElement>();
	const [showPermanentFilters, setShowPermanentFilters] = useState(false);

	useSearchTermStorage(searchTerm, searchStorageKey, onSearchTermChange);

	const handleQuickFilterClick = (id: string) => {
		onActiveQuickFilterIdChange(activeQuickFilterId === id ? null : id);
	};

	return (
		<div className="w-full">
			<SearchInputRow
				searchTerm={searchTerm}
				searchPlaceholder={searchPlaceholder}
				searchInputRef={searchInputRef}
				loading={loading}
				loadingTooltip={loadingTooltip}
				showPermanentFilters={showPermanentFilters}
				permanentFilterTitle={permanentFilterTitle}
				selectedFilterCount={selectedPermanentFilters.size}
				onSearchTermChange={onSearchTermChange}
				onTogglePermanentFilters={() => setShowPermanentFilters((v) => !v)}
			/>

			<PermanentFiltersPanel
				show={showPermanentFilters}
				title={permanentFilterTitle}
				options={permanentFilterOptions}
				selected={selectedPermanentFilters}
				onChange={onSelectedPermanentFiltersChange}
			/>

			<QuickFiltersBar filters={quickFilters} activeId={activeQuickFilterId} onToggle={handleQuickFilterClick} />
		</div>
	);
}
