'use client';

import { LuFilter, LuX } from 'react-icons/lu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface SearchInputRowProps {
	searchTerm: string;
	searchPlaceholder: string;
	searchInputRef: React.RefObject<HTMLInputElement | null>;
	loading: boolean;
	loadingTooltip?: string;
	showPermanentFilters: boolean;
	permanentFilterTitle: string;
	selectedFilterCount: number;
	onSearchTermChange: (value: string) => void;
	onTogglePermanentFilters: () => void;
}

const TOGGLE_VARIANTS = ['outline', 'default'] as const;

function toggleVariant(active: boolean) {
	return TOGGLE_VARIANTS[Number(active)];
}

function ClearSearchButton({
	searchTerm,
	onSearchTermChange,
}: {
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
}) {
	if (!searchTerm) return null;
	return (
		<Button
			variant="ghost"
			size="icon"
			className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
			onClick={() => onSearchTermChange('')}
			title="Wis filter"
		>
			<LuX className="h-4 w-4" />
		</Button>
	);
}

function LoadingTooltipContent({ loadingTooltip }: { loadingTooltip?: string }) {
	if (!loadingTooltip) return null;
	return <TooltipContent>{loadingTooltip}</TooltipContent>;
}

function SearchLoadingIndicator({ loading, loadingTooltip }: { loading: boolean; loadingTooltip?: string }) {
	if (!loading) return null;
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div>
					<LoadingSpinner />
				</div>
			</TooltipTrigger>
			<LoadingTooltipContent loadingTooltip={loadingTooltip} />
		</Tooltip>
	);
}

function SelectedFilterCountBadge({ selectedFilterCount }: { selectedFilterCount: number }) {
	if (selectedFilterCount <= 0) return null;
	return (
		<Badge variant="default" className="absolute -top-3 -right-3 h-5 min-w-5 px-1 tabular-nums rounded-full">
			{selectedFilterCount}
		</Badge>
	);
}

export function SearchInputRow({
	searchTerm,
	searchPlaceholder,
	searchInputRef,
	loading,
	loadingTooltip,
	showPermanentFilters,
	permanentFilterTitle,
	selectedFilterCount,
	onSearchTermChange,
	onTogglePermanentFilters,
}: SearchInputRowProps) {
	return (
		<div className="flex items-center mb-2 gap-2 pr-4">
			<div className="relative min-w-0 grow overflow-visible">
				<input
					ref={searchInputRef}
					type="text"
					placeholder={searchPlaceholder}
					className={cn(
						'w-full rounded-md border border-input bg-input p-2 pr-10 text-md text-foreground',
						'outline-none focus-visible:ring-2 focus-visible:ring-inset',
						'focus-visible:ring-ring dark:focus-visible:ring-white/55',
						'dark:focus-visible:border-white/35',
					)}
					value={searchTerm}
					onChange={(e) => onSearchTermChange(e.target.value)}
				/>
				<ClearSearchButton searchTerm={searchTerm} onSearchTermChange={onSearchTermChange} />
			</div>
			<SearchLoadingIndicator loading={loading} loadingTooltip={loadingTooltip} />
			<Button
				variant={toggleVariant(showPermanentFilters)}
				size="icon"
				className="relative"
				onClick={onTogglePermanentFilters}
				title={permanentFilterTitle}
			>
				<SelectedFilterCountBadge selectedFilterCount={selectedFilterCount} />
				<LuFilter className="h-4 w-4" />
			</Button>
		</div>
	);
}
