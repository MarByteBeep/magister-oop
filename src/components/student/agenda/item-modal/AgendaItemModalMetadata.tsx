'use client';

import type { ReactNode } from 'react';
import { LuCalendarClock, LuCalendarRange, LuClock, LuGraduationCap, LuMapPin, LuUser } from 'react-icons/lu';
import { expectedEndLabel } from '@/lib/absence-notice/utils';
import { isAbsenceNoticeEntry } from '@/lib/agenda/entryUtils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

export interface AgendaItemModalMetadataProps {
	entry: AgendaEntry;
	lessonStart: string;
	lessonEnd: string;
	locations: string | undefined;
	teachers: string | undefined;
}

function MetadataRow({ icon: Icon, children }: { icon: typeof LuClock; children: ReactNode }) {
	return (
		<div className="flex items-center gap-1.5 text-muted-foreground">
			<Icon className="h-4 w-4" />
			<span className="font-medium text-foreground">{children}</span>
		</div>
	);
}

function absenceCreatorName(entry: AgendaEntry): string {
	if (!isAbsenceNoticeEntry(entry)) return '';
	return [entry.notice.creator.initials, entry.notice.creator.infix, entry.notice.creator.lastName]
		.filter((part) => part.trim())
		.join(' ');
}

function AbsenceConsecutiveDaysRow({ entry }: { entry: AgendaEntry }) {
	if (!isAbsenceNoticeEntry(entry)) return null;
	if (entry.notice.consecutiveDays <= 1) return null;

	return <MetadataRow icon={LuCalendarRange}>{entry.notice.consecutiveDays} aaneengesloten dagen</MetadataRow>;
}

function ExpectedEndRow({ entry }: { entry: AgendaEntry }) {
	if (!isAbsenceNoticeEntry(entry)) return null;
	const expectedEnd = expectedEndLabel(entry.notice);
	if (!expectedEnd) return null;

	return <MetadataRow icon={LuCalendarClock}>Verwacht einde: {expectedEnd}</MetadataRow>;
}

function OptionalMetadataRow({ icon, value }: { icon: typeof LuClock; value: string | undefined }) {
	if (!value) return null;
	return <MetadataRow icon={icon}>{value}</MetadataRow>;
}

function AbsenceCreatorRow({ entry }: { entry: AgendaEntry }) {
	if (!isAbsenceNoticeEntry(entry)) return null;
	return <MetadataRow icon={LuUser}>{absenceCreatorName(entry)}</MetadataRow>;
}

export default function AgendaItemModalMetadata({
	entry,
	lessonStart,
	lessonEnd,
	locations,
	teachers,
}: AgendaItemModalMetadataProps) {
	return (
		<div className="flex flex-wrap gap-4 text-sm">
			<MetadataRow icon={LuClock}>
				{lessonStart} - {lessonEnd}
			</MetadataRow>
			<AbsenceConsecutiveDaysRow entry={entry} />
			<ExpectedEndRow entry={entry} />
			<OptionalMetadataRow icon={LuMapPin} value={locations} />
			<OptionalMetadataRow icon={LuGraduationCap} value={teachers} />
			<AbsenceCreatorRow entry={entry} />
		</div>
	);
}
