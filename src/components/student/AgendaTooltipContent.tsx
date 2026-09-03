'use client';

import { LuTriangleAlert } from 'react-icons/lu';
import { isAbsenceNoticeEntry, isReturnMeasureEntry } from '@/lib/agendaEntryUtils';
import { returnMeasureIconClasses } from '@/lib/agendaKindStyles';
import { getAgendaItemInfo } from '@/lib/agendaUtils';
import { formatTime } from '@/lib/dateUtils';
import { getReturnMeasureDisplay } from '@/lib/returnMeasureUtils';
import { cn } from '@/lib/utils';
import type { AbsenceNoticePerson } from '@/magister/response/absence-notice.types';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';

interface AgendaTooltipContentProps {
	entry: AgendaEntry;
}

function formatCreatorRole(role: string): string {
	const normalized = role.toLowerCase();
	if (normalized === 'parent') return 'ouder';
	if (normalized === 'staff' || normalized === 'employee') return 'medewerker';
	if (normalized === 'student') return 'leerling';
	return role;
}

function formatCreatorName(creator: AbsenceNoticePerson): string {
	const infix = creator.infix.trim();
	const lastName = creator.lastName.trim();
	return [creator.initials, infix, lastName].filter(Boolean).join(' ');
}

function AgendaTooltipContent({ entry }: AgendaTooltipContentProps) {
	const beginTime = new Date(entry.start);
	const endTime = new Date(entry.end);

	if (isAbsenceNoticeEntry(entry)) {
		const { notice } = entry;
		const creatorLabel = `${formatCreatorName(notice.creator)} (${formatCreatorRole(notice.creator.role)})`;

		return (
			<div className="space-y-1">
				<div className="font-bold">{notice.attendanceTypeDesc}</div>
				<div>Code: {notice.attendanceTypeCode}</div>
				<div>
					Tijd: {formatTime(beginTime)} - {formatTime(endTime)}
				</div>
				<div>Gemeld door: {creatorLabel}</div>
				{notice.recurrence != null && <div>Herhaling: ja</div>}
			</div>
		);
	}

	if (isReturnMeasureEntry(entry)) {
		const display = getReturnMeasureDisplay(entry.measure);

		return (
			<div className="space-y-1">
				{display.hasMaatregel && <div className="font-bold">{display.maatregelOmschrijving}</div>}
				{display.hasOmschrijving && (
					<div className={display.hasMaatregel ? undefined : 'font-bold'}>
						{display.hasBoth && (
							<LuTriangleAlert
								className={cn(
									'mr-1 inline h-3.5 w-3.5 shrink-0 align-[-0.125em]',
									returnMeasureIconClasses,
								)}
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

	const { courseDescriptions, teachers, locations, subject } = getAgendaItemInfo(entry.item);

	return (
		<div className="space-y-1">
			<div className="font-bold">{courseDescriptions ?? subject}</div>
			<div>
				Tijd: {formatTime(beginTime)} - {formatTime(endTime)}
			</div>
			{teachers && <div>Docenten: {teachers}</div>}
			{locations && <div>Locatie: {locations}</div>}
			{entry.item.opmerking && <div>Opmerking: {entry.item.opmerking}</div>}
		</div>
	);
}

export default AgendaTooltipContent;
