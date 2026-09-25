import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { fullDayScheduleShortcutTooltip } from '@/lib/fullDayScheduleUtils';

interface AgendaFullDayShortcutCellWrapperProps {
	value: Date;
	range: Date[];
	children: ReactNode;
}

export default function AgendaFullDayShortcutCellWrapper({ children }: AgendaFullDayShortcutCellWrapperProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent>{fullDayScheduleShortcutTooltip}</TooltipContent>
		</Tooltip>
	);
}
