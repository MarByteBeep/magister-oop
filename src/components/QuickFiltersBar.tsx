import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { QuickFilterItem } from './SearchAndFiltersBar';

export interface QuickFiltersBarProps {
	filters: QuickFilterItem[];
	activeId: string | null;
	onToggle: (id: string) => void;
}

function QuickFilterBadge({ count, isActive }: { count: number | undefined; isActive: boolean }) {
	if (count === undefined) return null;
	return (
		<Badge variant={isActive ? 'secondary' : 'outline'} className="h-5 min-w-5 px-1.5 tabular-nums text-xs">
			{count}
		</Badge>
	);
}

function QuickFilterButton({
	filter,
	isActive,
	onToggle,
}: {
	filter: QuickFilterItem;
	isActive: boolean;
	onToggle: (id: string) => void;
}) {
	return (
		<Button
			key={filter.id}
			variant={isActive ? 'default' : 'outline'}
			size="sm"
			className="h-8 py-1.5 px-3 text-sm gap-1.5"
			onClick={() => onToggle(filter.id)}
			aria-pressed={isActive}
		>
			<span>{filter.label}</span>
			<QuickFilterBadge count={filter.count} isActive={isActive} />
		</Button>
	);
}

export function QuickFiltersBar(props: QuickFiltersBarProps) {
	if (props.filters.length === 0) return null;

	return (
		<div className="w-full flex flex-wrap items-center gap-1.5 mb-4">
			{props.filters.map((qf) => (
				<QuickFilterButton
					key={qf.id}
					filter={qf}
					isActive={props.activeId === qf.id}
					onToggle={props.onToggle}
				/>
			))}
		</div>
	);
}
