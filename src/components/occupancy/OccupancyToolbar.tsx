import { LuChartLine, LuFilter } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface OccupancyToolbarProps {
	showLocationFilters: boolean;
	showChart: boolean;
	selectedCount: number;
	totalLocations: number;
	onToggleFilters: () => void;
	onToggleChart: () => void;
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
				variant={showLocationFilters ? 'default' : 'outline'}
				size="icon"
				className="relative"
				onClick={onToggleFilters}
			>
				{selectedCount > 0 && selectedCount < totalLocations && (
					<Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1">{selectedCount}</Badge>
				)}
				<LuFilter className="h-4 w-4" />
			</Button>

			<Button variant={showChart ? 'default' : 'outline'} size="icon" onClick={onToggleChart}>
				<LuChartLine className="h-4 w-4" />
			</Button>
		</div>
	);
}
