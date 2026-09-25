'use client';

import type { ReactNode } from 'react';
import { LuCalendarClock, LuCalendarRange, LuClock, LuGraduationCap, LuMapPin, LuUser } from 'react-icons/lu';
import { expectedEndLabel } from '@/lib/absenceNoticeUtils';
import { isAbsenceNoticeEntry } from '@/lib/agendaEntryUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';

interface AgendaItemModalMetadataProps {
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

export default function AgendaItemModalMetadata({
	entry,
	lessonStart,
	lessonEnd,
	locations,
	teachers,
}: AgendaItemModalMetadataProps) {
	const expectedEnd = isAbsenceNoticeEntry(entry) ? expectedEndLabel(entry.notice) : null;

	return (
		<div className="flex flex-wrap gap-4 text-sm">
			<MetadataRow icon={LuClock}>
				{lessonStart} - {lessonEnd}
			</MetadataRow>
			{isAbsenceNoticeEntry(entry) && entry.notice.consecutiveDays > 1 && (
				<MetadataRow icon={LuCalendarRange}>{entry.notice.consecutiveDays} aaneengesloten dagen</MetadataRow>
			)}
			{expectedEnd && <MetadataRow icon={LuCalendarClock}>Verwacht einde: {expectedEnd}</MetadataRow>}
			{locations && <MetadataRow icon={LuMapPin}>{locations}</MetadataRow>}
			{teachers && <MetadataRow icon={LuGraduationCap}>{teachers}</MetadataRow>}
			{isAbsenceNoticeEntry(entry) && <MetadataRow icon={LuUser}>{absenceCreatorName(entry)}</MetadataRow>}
		</div>
	);
}
