'use client';

import ReturnMeasureModal from '@/components/return-measure/ReturnMeasureModal';
import AgendaItemModalMetadata from '@/components/student/agenda/AgendaItemModalMetadata';
import AgendaItemStudentsList from '@/components/student/agenda/AgendaItemStudentsList';
import LessonHourBadge from '@/components/student/agenda/LessonHourBadge';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStudentsContext } from '@/context/StudentsContext';
import { useAgendaItemStudents } from '@/hooks/agenda/useAgendaItemStudents';
import { isAbsenceNoticeEntry, isLessonEntry, isReturnMeasureEntry } from '@/lib/agenda/entryUtils';
import { getAgendaItemInfo } from '@/lib/agenda/utils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

interface AgendaItemModalProps {
	entry: AgendaEntry;
	isOpen: boolean;
	onClose: () => void;
	onOpenStudent?: (student: Student) => void;
}

function resolveStandardModalTitle(entry: AgendaEntry): string {
	if (isAbsenceNoticeEntry(entry)) return entry.notice.attendanceTypeDescription;
	if (isLessonEntry(entry)) {
		const { courseDescriptions, subject } = getAgendaItemInfo(entry.item);
		return courseDescriptions ?? subject ?? 'Agenda item';
	}
	return 'Agenda item';
}

export default function AgendaItemModal({ entry, isOpen, onClose, onOpenStudent }: AgendaItemModalProps) {
	if (isReturnMeasureEntry(entry)) {
		return (
			<ReturnMeasureModal
				measure={entry.measure}
				isOpen={isOpen}
				onClose={onClose}
				onOpenStudent={onOpenStudent}
			/>
		);
	}

	return <StandardAgendaItemModal entry={entry} isOpen={isOpen} onClose={onClose} onOpenStudent={onOpenStudent} />;
}

function StandardAgendaItemModal({ entry, isOpen, onClose, onOpenStudent }: AgendaItemModalProps) {
	const { students } = useStudentsContext();
	const lessonEntry = isLessonEntry(entry) ? entry : null;
	const { courseDescriptions, courseCodes, teachers, locations } = lessonEntry
		? getAgendaItemInfo(lessonEntry.item)
		: { courseDescriptions: undefined, courseCodes: undefined, teachers: undefined, locations: undefined };
	const { lessonStart, lessonEnd, hasLocation, studentsInLocation } = useAgendaItemStudents(entry, students);
	const title = resolveStandardModalTitle(entry);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-[800px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{lessonEntry?.item.lesuur?.begin && (
							<LessonHourBadge
								lessonInfo={{ status: 'lesson', lesson: lessonEntry.item.lesuur.begin }}
								className="h-7 w-7 text-sm"
							/>
						)}
						<span>{title}</span>
						{isAbsenceNoticeEntry(entry) && (
							<Badge variant="secondary">{entry.notice.attendanceTypeCode}</Badge>
						)}
						{lessonEntry && courseCodes && courseCodes !== courseDescriptions && (
							<Badge variant="secondary">{courseCodes}</Badge>
						)}
					</DialogTitle>
				</DialogHeader>

				<AgendaItemModalMetadata
					entry={entry}
					lessonStart={lessonStart}
					lessonEnd={lessonEnd}
					locations={locations}
					teachers={teachers}
				/>

				{lessonEntry?.item.opmerking && (
					<div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
						{lessonEntry.item.opmerking}
					</div>
				)}

				{hasLocation && lessonEntry && (
					<AgendaItemStudentsList studentsByClass={studentsInLocation} onOpenStudent={onOpenStudent} />
				)}
			</DialogContent>
		</Dialog>
	);
}
