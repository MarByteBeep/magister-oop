'use client';

import { LuTriangleAlert } from 'react-icons/lu';
import { getAgendaItemInfo } from '@/lib/agendaUtils';
import { formatTime } from '@/lib/dateUtils';
import { getReturnMeasureDisplay, isReturnMeasureAgendaItem } from '@/lib/returnMeasureUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';

interface AgendaTooltipContentProps {
	item: AgendaItem;
}

function AgendaTooltipContent({ item }: AgendaTooltipContentProps) {
	const beginTime = new Date(item.begin);
	const endTime = new Date(item.einde);

	if (isReturnMeasureAgendaItem(item)) {
		const display = getReturnMeasureDisplay(item);

		return (
			<div className="space-y-1">
				{display.hasMaatregel && <div className="font-bold">{display.maatregelOmschrijving}</div>}
				{display.hasOmschrijving && (
					<div className={display.hasMaatregel ? undefined : 'font-bold'}>
						{display.hasBoth && (
							<LuTriangleAlert
								className="mr-1 inline h-3.5 w-3.5 shrink-0 align-[-0.125em] text-amber-500"
								aria-hidden
							/>
						)}
						{display.omschrijving}
					</div>
				)}
				<div>
					Tijd: {formatTime(beginTime)} - {formatTime(endTime)}
				</div>
			</div>
		);
	}

	const { courseDescriptions, teachers, locations, subject } = getAgendaItemInfo(item);

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
