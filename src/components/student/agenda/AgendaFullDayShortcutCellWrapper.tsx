import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { fullDayScheduleShortcutTooltip } from '@/lib/agenda/fullDayScheduleUtils';

interface AgendaFullDayShortcutCellWrapperProps {
	value: Date;
	range: Date[];
	children: ReactNode;
	/** When false, keep the day shortcut without the create-mode tooltip. */
	showCreateTooltip?: boolean;
}

export default function AgendaFullDayShortcutCellWrapper({
	children,
	showCreateTooltip = true,
}: AgendaFullDayShortcutCellWrapperProps) {
	if (!showCreateTooltip) return children;

	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent>{fullDayScheduleShortcutTooltip}</TooltipContent>
		</Tooltip>
	);
}
