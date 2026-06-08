import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { QuickFilterItem } from './SearchAndFiltersBar';

interface QuickFiltersBarProps {
	filters: QuickFilterItem[];
	activeId: string | null;
	onToggle: (id: string) => void;
}

export function QuickFiltersBar({ filters, activeId, onToggle }: QuickFiltersBarProps) {
	if (filters.length === 0) return null;

	return (
		<div className="w-full flex flex-wrap items-center gap-1.5 mb-4">
			{filters.map((qf) => {
				const isActive = activeId === qf.id;
				return (
					<Button
						key={qf.id}
						variant={isActive ? 'default' : 'outline'}
						size="sm"
						className="h-8 py-1.5 px-3 text-sm gap-1.5"
						onClick={() => onToggle(qf.id)}
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
	);
}
