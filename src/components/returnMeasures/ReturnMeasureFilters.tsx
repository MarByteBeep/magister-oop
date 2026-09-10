'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
			<Select value={period} onValueChange={(value) => onPeriodChange(value as ReturnMeasurePeriod)}>
				<SelectTrigger aria-label="Periode">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{PERIODS.map(({ value, label }) => (
						<SelectItem key={value} value={value}>
							{label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select value={status} onValueChange={(value) => onStatusChange(value as ReturnMeasureStatusFilter)}>
				<SelectTrigger aria-label="Status">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{STATUSES.map(({ value, label }) => (
						<SelectItem key={value} value={value}>
							{label} ({counts[value]})
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
