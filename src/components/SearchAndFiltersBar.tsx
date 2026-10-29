'use client';

import { useState } from 'react';
import { PermanentFiltersPanel } from '@/components/PermanentFiltersPanel';
import { QuickFiltersBar } from '@/components/QuickFiltersBar';
import { SearchInputRow } from '@/components/SearchInputRow';
import { useAutoFocus } from '@/hooks/shared/useAutofocus';
import { useSearchTermStorage } from '@/hooks/shared/useSearchTermStorage';

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

function nextQuickFilterId(activeQuickFilterId: string | null, id: string): string | null {
	if (activeQuickFilterId === id) return null;
	return id;
}

export function SearchAndFiltersBar(props: SearchAndFiltersBarProps) {
	const searchPlaceholder = props.searchPlaceholder ?? 'Zoek…';
	const permanentFilterTitle = props.permanentFilterTitle ?? 'Permanente filters';
	const loading = props.loading === true;
	const searchInputRef = useAutoFocus<HTMLInputElement>();
	const [showPermanentFilters, setShowPermanentFilters] = useState(false);

	useSearchTermStorage(props.searchTerm, props.searchStorageKey, props.onSearchTermChange);

	const handleQuickFilterClick = (id: string) => {
		props.onActiveQuickFilterIdChange(nextQuickFilterId(props.activeQuickFilterId, id));
	};

	return (
		<div className="w-full">
			<SearchInputRow
				searchTerm={props.searchTerm}
				searchPlaceholder={searchPlaceholder}
				searchInputRef={searchInputRef}
				loading={loading}
				loadingTooltip={props.loadingTooltip}
				showPermanentFilters={showPermanentFilters}
				permanentFilterTitle={permanentFilterTitle}
				selectedFilterCount={props.selectedPermanentFilters.size}
				onSearchTermChange={props.onSearchTermChange}
				onTogglePermanentFilters={() => setShowPermanentFilters((v) => !v)}
			/>

			<PermanentFiltersPanel
				show={showPermanentFilters}
				title={permanentFilterTitle}
				options={props.permanentFilterOptions}
				selected={props.selectedPermanentFilters}
				onChange={props.onSelectedPermanentFiltersChange}
			/>

			<QuickFiltersBar
				filters={props.quickFilters}
				activeId={props.activeQuickFilterId}
				onToggle={handleQuickFilterClick}
			/>
		</div>
	);
}
