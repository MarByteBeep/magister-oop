'use client';

import ReturnMeasureAgendaTooltip from '@/components/student/agenda/ReturnMeasureAgendaTooltip';
import { expectedEndLabel } from '@/lib/absence-notice/utils';
import { isAbsenceNoticeEntry, isReturnMeasureEntry } from '@/lib/agenda/entryUtils';
import { getAgendaItemInfo } from '@/lib/agenda/utils';
import { formatTime } from '@/lib/shared/dateUtils';
import type { AbsenceNoticePerson } from '@/magister/response/absenceNotice.types';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

interface AgendaTooltipContentProps {
	entry: AgendaEntry;
}

function formatCreatorRole(role: string): string {
	const normalized = role.toLowerCase();
	if (normalized === 'parent') return 'ouder';
	if (normalized === 'staff' || normalized === 'employee') return 'medewerker';
	if (normalized === 'supportingstaff') return 'ondersteuner';
	if (normalized === 'student') return 'leerling';
	return role;
}

function formatCreatorName(creator: AbsenceNoticePerson): string {
	const infix = creator.infix.trim();
	const lastName = creator.lastName.trim();
	return [creator.initials, infix, lastName].filter(Boolean).join(' ');
}

function AbsenceNoticeTooltip({
	entry,
	beginTime,
	endTime,
}: {
	entry: Extract<AgendaEntry, { kind: 'absence-notice' }>;
	beginTime: Date;
	endTime: Date;
}) {
	const { notice } = entry;
	const creatorLabel = `${formatCreatorName(notice.creator)} (${formatCreatorRole(notice.creator.role)})`;
	const expectedEnd = expectedEndLabel(notice);

	return (
		<div className="space-y-1">
			<div className="font-bold">{notice.attendanceTypeDescription}</div>
			<div>Code: {notice.attendanceTypeCode}</div>
			<div>
				Tijd: {formatTime(beginTime)} - {formatTime(endTime)}
			</div>
			{notice.consecutiveDays > 1 && <div>Aaneengesloten dagen: {notice.consecutiveDays}</div>}
			{expectedEnd && <div>Verwacht einde: {expectedEnd}</div>}
			{notice.comment.trim() ? <div>Opmerking: {notice.comment}</div> : null}
			<div>Gemeld door: {creatorLabel}</div>
			{notice.isRecurring && <div>Herhaling: ja</div>}
		</div>
	);
}

function AgendaTooltipContent({ entry }: AgendaTooltipContentProps) {
	const beginTime = new Date(entry.start);
	const endTime = new Date(entry.end);

	if (isAbsenceNoticeEntry(entry)) {
		return <AbsenceNoticeTooltip entry={entry} beginTime={beginTime} endTime={endTime} />;
	}

	if (isReturnMeasureEntry(entry)) {
		return <ReturnMeasureAgendaTooltip measure={entry.measure} beginTime={beginTime} endTime={endTime} />;
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
