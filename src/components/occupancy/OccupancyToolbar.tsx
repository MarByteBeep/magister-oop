import { LuChartLine, LuFilter } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface OccupancyToolbarProps {
	showLocationFilters: boolean;
	showChart: boolean;
	selectedCount: number;
	totalLocations: number;
	onToggleFilters: () => void;
	onToggleChart: () => void;
}

const TOGGLE_VARIANTS = ['outline', 'default'] as const;

function toggleVariant(active: boolean) {
	return TOGGLE_VARIANTS[Number(active)];
}

function PartialSelectionBadge({ selectedCount, totalLocations }: { selectedCount: number; totalLocations: number }) {
	if (selectedCount === 0) return null;
	if (selectedCount >= totalLocations) return null;
	return <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1">{selectedCount}</Badge>;
}

export default function OccupancyToolbar({
	showLocationFilters,
	showChart,
	selectedCount,
	totalLocations,
	onToggleFilters,
	onToggleChart,
}: OccupancyToolbarProps) {
	return (
		<div className="flex justify-end gap-2 mb-4">
			<Button
				variant={toggleVariant(showLocationFilters)}
				size="icon"
				className="relative"
				onClick={onToggleFilters}
			>
				<PartialSelectionBadge selectedCount={selectedCount} totalLocations={totalLocations} />
				<LuFilter className="h-4 w-4" />
			</Button>

			<Button variant={toggleVariant(showChart)} size="icon" onClick={onToggleChart}>
				<LuChartLine className="h-4 w-4" />
			</Button>
		</div>
	);
}
