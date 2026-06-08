import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getAgendaItemInfo } from '@/lib/agendaUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import AgendaTooltipContent from './AgendaTooltipContent';

interface AgendaItemDisplayContentProps {
	item: AgendaItem;
}

export default function AgendaItemDisplayContent({ item }: AgendaItemDisplayContentProps) {
	const { locations, courseCodes, teachersCodes, subject } = getAgendaItemInfo(item);

	return (
		<div className="flex flex-col items-start text-left w-full min-w-0">
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="flex flex-col w-full min-w-0">
						<div className="w-full min-w-0 truncate">
							<span className="font-medium text-foreground">{courseCodes ?? subject}</span>
							{locations && <span className="text-muted-foreground"> ({locations})</span>}
						</div>
						<div className="w-full min-w-0 truncate">
							<span className="text-xs text-muted-foreground">{teachersCodes}</span>
						</div>
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<AgendaTooltipContent item={item} />
				</TooltipContent>
			</Tooltip>
		</div>
	);
}
