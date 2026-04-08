'use client';

import { getAgendaItemInfo } from '@/lib/agendaUtils';
import { formatTime } from '@/lib/dateUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';

interface AgendaTooltipContentProps {
	item: AgendaItem;
}

function AgendaTooltipContent({ item }: AgendaTooltipContentProps) {
	const { courseDescriptions, teachers, locations, subject } = getAgendaItemInfo(item);
	const beginTime = new Date(item.begin);
	const endTime = new Date(item.einde);

	return (
		<div className="space-y-1">
			<div className="font-bold">{courseDescriptions ?? subject}</div>
			<div>
				Tijd: {formatTime(beginTime)} - {formatTime(endTime)}
			</div>
			{teachers && <div>Docenten: {teachers}</div>}
			{locations && <div>Locatie: {locations}</div>}
			{item.opmerking && <div>Opmerking: {item.opmerking}</div>}
		</div>
	);
}

export default AgendaTooltipContent;
