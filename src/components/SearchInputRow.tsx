'use client';

import { LuFilter, LuX } from 'react-icons/lu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SearchInputRowProps {
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
				onClick={onTogglePermanentFilters}
				title={permanentFilterTitle}
			>
				{selectedFilterCount > 0 && (
					<Badge
						variant="default"
						className="absolute -top-3 -right-3 h-5 min-w-5 px-1 tabular-nums rounded-full"
					>
						{selectedFilterCount}
					</Badge>
				)}
				<LuFilter className="h-4 w-4" />
			</Button>
		</div>
	);
}
