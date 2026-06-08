'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface OccupancyFiltersProps {
	show: boolean;
	allLocations: string[];
	selectedLocations: Set<string>;
	onLocationFilterChange: (location: string, checked: boolean) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
}

export default function OccupancyFilters({
	show,
	allLocations,
	selectedLocations,
	onLocationFilterChange,
	onSelectAll,
	onDeselectAll,
}: OccupancyFiltersProps) {
	return (
		<div
			className={cn(
				'overflow-hidden transition-all duration-300',
				show ? 'max-h-screen opacity-100 mb-4' : 'max-h-0 opacity-0',
			)}
		>
			<div className="p-4 border rounded-md bg-card shadow-sm">
				<h3 className="text-sm font-medium mb-2">Lokalen filters</h3>

				<div className="flex gap-4 mb-4">
					<Button variant="outline" size="sm" onClick={onSelectAll}>
						Alles selecteren
					</Button>
					<Button variant="outline" size="sm" onClick={onDeselectAll}>
						Alles deselecteren
					</Button>
				</div>

				<div className="grid grid-cols-4 gap-2">
					{allLocations.map((location) => (
						<div key={location} className="flex items-center space-x-2">
							<Checkbox
								id={`location-${location}`}
								checked={selectedLocations.has(location)}
								onCheckedChange={(checked) => onLocationFilterChange(location, checked as boolean)}
							/>
							<label htmlFor={`location-${location}`} className="text-sm font-medium">
								{location}
							</label>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
