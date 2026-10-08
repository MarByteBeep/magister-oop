import {
	returnMeasureGhostSurfaceClasses,
	returnMeasureNewPlanSurfaceClasses,
	returnMeasureSourceSurfaceClasses,
} from '@/lib/agenda/kindStyles';
import { cn } from '@/lib/utils';

const LEGEND_ITEMS = [
	{ label: 'Huidige (niet gemeld)', swatchClassName: returnMeasureSourceSurfaceClasses },
	{ label: 'Andere maatregelen', swatchClassName: returnMeasureGhostSurfaceClasses },
	{ label: 'Nieuwe planning', swatchClassName: returnMeasureNewPlanSurfaceClasses },
] as const;

function LegendSwatch({ className, label }: { className: string; label: string }) {
	return (
		<span className="inline-flex items-center gap-1.5">
			<span className={cn('h-3 w-3 shrink-0 rounded-sm border', className)} aria-hidden />
			<span>{label}</span>
		</span>
	);
}

export default function ReturnMeasureRescheduleLegend() {
	return (
		<div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 text-xs text-muted-foreground border-t">
			{LEGEND_ITEMS.map((item) => (
				<LegendSwatch key={item.label} className={item.swatchClassName} label={item.label} />
			))}
		</div>
	);
}
