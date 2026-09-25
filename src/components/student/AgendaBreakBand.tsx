import { LuClock3 } from 'react-icons/lu';

import { formatTime } from '@/lib/dateUtils';

interface AgendaBreakBandProps {
	start: Date;
	end: Date;
}

export default function AgendaBreakBand({ start, end }: AgendaBreakBandProps) {
	const durationMinutes = (end.getTime() - start.getTime()) / 60_000;
	const showLabel = durationMinutes >= 25;

	return (
		<div className="relative mx-1 box-border h-full overflow-hidden rounded-lg border border-border/45 bg-muted/30 dark:bg-muted/20">
			<div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,color-mix(in_oklch,var(--foreground)_5%,transparent)_4px,color-mix(in_oklch,var(--foreground)_5%,transparent)_5px)]" />
			<div className="absolute right-1.5 top-0.5 z-10 flex items-center gap-1 text-[9px] text-muted-foreground">
				<LuClock3 className="h-2.5 w-2.5 shrink-0" />
				<span>
					{formatTime(start)} - {formatTime(end)}
				</span>
			</div>
			{showLabel && (
				<div className="relative flex h-full items-center px-1.5">
					<span className="truncate text-[11px] font-medium text-muted-foreground">Pauze</span>
				</div>
			)}
		</div>
	);
}
