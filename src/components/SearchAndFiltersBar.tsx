'use client';

import { useEffect, useState } from 'react';
import { LuFilter, LuX } from 'react-icons/lu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAutoFocus } from '@/hooks/useAutofocus';
import { cn } from '@/lib/utils';

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
	/** When provided, search term is persisted to session storage under this key (load on mount, save on change). */
	searchStorageKey?: string;
	permanentFilterTitle?: string;
	permanentFilterOptions: PermanentFilterOption[];
	selectedPermanentFilters: Set<string>;
	onSelectedPermanentFiltersChange: (value: string, checked: boolean) => void;
	quickFilters: QuickFilterItem[];
	activeQuickFilterId: string | null;
	onActiveQuickFilterIdChange: (id: string | null) => void;
	loading?: boolean;
	/** Optional content for tooltip when loading (e.g. "X leerlingen nog te laden") */
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
	/** Avoid writing to session storage before the initial load finishes (prevents wiping a stored term). */
	const [searchStorageReady, setSearchStorageReady] = useState(!searchStorageKey);

	// Optional: load search term from session storage on mount
	useEffect(() => {
		if (!searchStorageKey) return;
		let cancelled = false;
		(async () => {
			const { storage } = await import('@/lib/storage');
			const stored = await storage.session.get<string>(searchStorageKey);
			if (!cancelled && stored != null) onSearchTermChange(stored);
			if (!cancelled) setSearchStorageReady(true);
		})();
		return () => {
			cancelled = true;
		};
	}, [searchStorageKey, onSearchTermChange]);

	useEffect(() => {
		if (!searchStorageKey || !searchStorageReady) return;
		(async () => {
			const { storage } = await import('@/lib/storage');
			await storage.session.set(searchStorageKey, searchTerm);
		})();
	}, [searchTerm, searchStorageKey, searchStorageReady]);

	const handleQuickFilterClick = (id: string) => {
		onActiveQuickFilterIdChange(activeQuickFilterId === id ? null : id);
	};

	return (
		<div className="w-full">
			{/* Search row */}
			<div className="flex items-center mb-2 gap-2 pr-4">
				<div className="relative grow">
					<input
						ref={searchInputRef}
						type="text"
						placeholder={searchPlaceholder}
						className="w-full p-2 border rounded-md bg-input text-foreground text-md pr-10"
						value={searchTerm}
						onChange={(e) => onSearchTermChange(e.target.value)}
					/>
					{searchTerm && (
						<Button
							variant="ghost"
							size="icon"
							className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
							onClick={() => onSearchTermChange('')}
							title="Wis filter"
						>
							<LuX className="h-4 w-4" />
						</Button>
					)}
				</div>
				{loading && (
					<Tooltip>
						<TooltipTrigger asChild>
							<div>
								<LoadingSpinner />
							</div>
						</TooltipTrigger>
						{loadingTooltip && <TooltipContent>{loadingTooltip}</TooltipContent>}
					</Tooltip>
				)}
				<Button
					variant={showPermanentFilters ? 'default' : 'outline'}
					size="icon"
					className="relative"
					onClick={() => setShowPermanentFilters(!showPermanentFilters)}
					title={permanentFilterTitle}
				>
					{selectedPermanentFilters.size > 0 && (
						<Badge
							variant="default"
							className="absolute -top-3 -right-3 h-5 min-w-5 px-1 tabular-nums rounded-full"
						>
							{selectedPermanentFilters.size}
						</Badge>
					)}
					<LuFilter className="h-4 w-4" />
				</Button>
			</div>

			{/* Permanent filters (collapsible) */}
			<div
				className={cn(
					'overflow-hidden transition-all duration-300 ease-in-out',
					showPermanentFilters ? 'max-h-screen opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0',
				)}
			>
				<div className="p-4 border rounded-md bg-card shadow-sm">
					<h3 className="text-sm font-medium text-foreground mb-2">{permanentFilterTitle}</h3>
					<div className="grid grid-cols-4 gap-2">
						{permanentFilterOptions.map((opt) => (
							<div key={opt.value} className="flex items-center space-x-2">
								<Checkbox
									id={`perm-${opt.value}`}
									checked={selectedPermanentFilters.has(opt.value)}
									onCheckedChange={(checked) =>
										onSelectedPermanentFiltersChange(opt.value, checked === true)
									}
								/>
								<label
									htmlFor={`perm-${opt.value}`}
									className="text-sm font-medium leading-none cursor-pointer"
								>
									{opt.label}
								</label>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Quick filter bar: full width, narrow chips with optional badge */}
			{quickFilters.length > 0 && (
				<div className="w-full flex flex-wrap items-center gap-1.5 mb-4">
					{quickFilters.map((qf) => {
						const isActive = activeQuickFilterId === qf.id;
						return (
							<Button
								key={qf.id}
								variant={isActive ? 'default' : 'outline'}
								size="sm"
								className="h-8 py-1.5 px-3 text-sm gap-1.5"
								onClick={() => handleQuickFilterClick(qf.id)}
								aria-pressed={isActive}
							>
								<span>{qf.label}</span>
								{qf.count !== undefined && (
									<Badge
										variant={isActive ? 'secondary' : 'outline'}
										className="h-5 min-w-5 px-1.5 tabular-nums text-xs"
									>
										{qf.count}
									</Badge>
								)}
							</Button>
						);
					})}
				</div>
			)}
		</div>
	);
}
