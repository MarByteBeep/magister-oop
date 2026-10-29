'use client';

import type { ReactNode } from 'react';
import ReturnMeasureAgendaTooltip from '@/components/student/agenda/calendar/ReturnMeasureAgendaTooltip';
import { expectedEndLabel } from '@/lib/absence-notice/utils';
import { isAbsenceNoticeEntry, isLessonEntry, isReturnMeasureEntry } from '@/lib/agenda/entryUtils';
import { getAgendaItemInfo } from '@/lib/agenda/utils';
import { formatTime } from '@/lib/shared/dateUtils';
import type { AbsenceNoticePerson } from '@/magister/response/absenceNotice.types';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

const CREATOR_ROLE_LABELS: Record<string, string> = {
	parent: 'ouder',
	staff: 'medewerker',
	employee: 'medewerker',
	supportingstaff: 'ondersteuner',
	student: 'leerling',
};

function formatCreatorRole(role: string): string {
	const label = CREATOR_ROLE_LABELS[role.toLowerCase()];
	if (label === undefined) return role;
	return label;
}

function formatCreatorName(creator: AbsenceNoticePerson): string {
	const infix = creator.infix.trim();
	const lastName = creator.lastName.trim();
	return [creator.initials, infix, lastName].filter(Boolean).join(' ');
}

function courseOrSubjectTitle(courseDescriptions: string | undefined, subject: string | undefined): string | undefined {
	if (courseDescriptions !== undefined) return courseDescriptions;
	return subject;
}

export interface AgendaTooltipContentProps {
	entry: AgendaEntry;
}

function OptionalTooltipLine({ show, children }: { show: boolean; children: string }) {
	if (!show) return null;
	return <div>{children}</div>;
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
			<OptionalTooltipLine show={notice.consecutiveDays > 1}>
				{`Aaneengesloten dagen: ${notice.consecutiveDays}`}
			</OptionalTooltipLine>
			<OptionalTooltipLine show={Boolean(expectedEnd)}>{`Verwacht einde: ${expectedEnd}`}</OptionalTooltipLine>
			<OptionalTooltipLine
				show={notice.comment.trim() !== ''}
			>{`Opmerking: ${notice.comment}`}</OptionalTooltipLine>
			<div>Gemeld door: {creatorLabel}</div>
			<OptionalTooltipLine show={notice.isRecurring}>Herhaling: ja</OptionalTooltipLine>
		</div>
	);
}

function LessonAgendaTooltip({
	entry,
	beginTime,
	endTime,
}: {
	entry: Extract<AgendaEntry, { kind: 'lesson' }>;
	beginTime: Date;
	endTime: Date;
}) {
	const { courseDescriptions, teachers, locations, subject } = getAgendaItemInfo(entry.item);

	return (
		<div className="space-y-1">
			<div className="font-bold">{courseOrSubjectTitle(courseDescriptions, subject)}</div>
			<div>
				Tijd: {formatTime(beginTime)} - {formatTime(endTime)}
			</div>
			<OptionalTooltipLine show={Boolean(teachers)}>{`Docenten: ${teachers}`}</OptionalTooltipLine>
			<OptionalTooltipLine show={Boolean(locations)}>{`Locatie: ${locations}`}</OptionalTooltipLine>
			<OptionalTooltipLine show={Boolean(entry.item.opmerking)}>
				{`Opmerking: ${entry.item.opmerking}`}
			</OptionalTooltipLine>
		</div>
	);
}

function renderLessonTooltip(entry: AgendaEntry, beginTime: Date, endTime: Date): ReactNode {
	if (!isLessonEntry(entry)) return null;
	return <LessonAgendaTooltip entry={entry} beginTime={beginTime} endTime={endTime} />;
}

function renderNonAbsenceTooltip(entry: AgendaEntry, beginTime: Date, endTime: Date): ReactNode {
	if (isReturnMeasureEntry(entry)) {
		return <ReturnMeasureAgendaTooltip measure={entry.measure} beginTime={beginTime} endTime={endTime} />;
	}
	return renderLessonTooltip(entry, beginTime, endTime);
}

function renderAgendaTooltip(entry: AgendaEntry, beginTime: Date, endTime: Date): ReactNode {
	if (isAbsenceNoticeEntry(entry)) {
		return <AbsenceNoticeTooltip entry={entry} beginTime={beginTime} endTime={endTime} />;
	}
	return renderNonAbsenceTooltip(entry, beginTime, endTime);
}

function AgendaTooltipContent({ entry }: AgendaTooltipContentProps) {
	return renderAgendaTooltip(entry, new Date(entry.start), new Date(entry.end));
}

export default AgendaTooltipContent;
