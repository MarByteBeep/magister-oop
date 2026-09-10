'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ReturnMeasurePeriod, ReturnMeasureStatusFilter } from '@/lib/returnMeasureOverview';

const PERIODS: { value: ReturnMeasurePeriod; label: string }[] = [
	{ value: 'today', label: 'Vandaag' },
	{ value: 'week', label: 'Deze week' },
	{ value: 'month', label: 'Deze maand' },
];

const STATUSES: { value: ReturnMeasureStatusFilter; label: string }[] = [
	{ value: 'open', label: 'Openstaand' },
	{ value: 'handled', label: 'Afgehandeld' },
	{ value: 'unplanned', label: 'Niet gepland' },
	{ value: 'all', label: 'Alles' },
];

interface ReturnMeasureFiltersProps {
	period: ReturnMeasurePeriod;
	status: ReturnMeasureStatusFilter;
	counts: Record<ReturnMeasureStatusFilter, number>;
	onPeriodChange: (period: ReturnMeasurePeriod) => void;
	onStatusChange: (status: ReturnMeasureStatusFilter) => void;
}

export default function ReturnMeasureFilters({
	period,
	status,
	counts,
	onPeriodChange,
	onStatusChange,
}: ReturnMeasureFiltersProps) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<ToggleGroup
				type="single"
				size="sm"
				value={period}
				aria-label="Periode"
				onValueChange={(value) => {
					if (value) onPeriodChange(value as ReturnMeasurePeriod);
				}}
			>
				{PERIODS.map(({ value, label }) => (
					<ToggleGroupItem key={value} value={value}>
						{label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>

			<ToggleGroup
				type="single"
				size="sm"
				value={status}
				aria-label="Status"
				onValueChange={(value) => {
					if (value) onStatusChange(value as ReturnMeasureStatusFilter);
				}}
			>
				{STATUSES.map(({ value, label }) => (
					<ToggleGroupItem key={value} value={value}>
						{label} ({counts[value]})
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</div>
	);
}
