import { LuClock3 } from 'react-icons/lu';

import { agendaHatchOverlayClasses } from '@/lib/agenda/kindStyles';
import { formatTime } from '@/lib/shared/dateUtils';

interface AgendaBreakBandProps {
	start: Date;
	end: Date;
}

export default function AgendaBreakBand({ start, end }: AgendaBreakBandProps) {
	const durationMinutes = (end.getTime() - start.getTime()) / 60_000;
	const showLabel = durationMinutes >= 25;

	return (
		<div className="relative mx-1 box-border h-full overflow-hidden rounded-lg border border-border/45 bg-muted/30 dark:bg-muted/20">
			<div className={agendaHatchOverlayClasses} />
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
