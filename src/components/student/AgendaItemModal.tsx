'use client';

import { LuClock, LuGraduationCap, LuMapPin, LuUser } from 'react-icons/lu';
import LessonHourBadge from '@/components/LessonHourBadge';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStudentsContext } from '@/context/StudentsContext';
import { useAgendaItemStudents } from '@/hooks/useAgendaItemStudents';
import { isAbsenceNoticeEntry, isLessonEntry, isReturnMeasureEntry } from '@/lib/agendaEntryUtils';
import { getAgendaItemInfo } from '@/lib/agendaUtils';
import { getReturnMeasureDisplay } from '@/lib/returnMeasureUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/magister/types';
import AgendaItemStudentsList from './AgendaItemStudentsList';

interface AgendaItemModalProps {
	entry: AgendaEntry;
	isOpen: boolean;
	onClose: () => void;
	onOpenStudent?: (student: Student) => void;
}

export default function AgendaItemModal({ entry, isOpen, onClose, onOpenStudent }: AgendaItemModalProps) {
	const { students } = useStudentsContext();
	const lessonEntry = isLessonEntry(entry) ? entry : null;
	const { courseDescriptions, courseCodes, teachers, locations, subject } = lessonEntry
		? getAgendaItemInfo(lessonEntry.item)
		: {
				courseDescriptions: undefined,
				courseCodes: undefined,
				teachers: undefined,
				locations: undefined,
				subject: undefined,
			};
	const { lessonStart, lessonEnd, hasLocation, studentsInLocation } = useAgendaItemStudents(entry, students);

	const title = isAbsenceNoticeEntry(entry)
		? entry.notice.attendanceTypeDesc
		: isReturnMeasureEntry(entry)
			? getReturnMeasureDisplay(entry.measure).primaryLabel
			: (courseDescriptions ?? subject ?? 'Agenda item');

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

				<div className="flex flex-wrap gap-4 text-sm">
					<div className="flex items-center gap-1.5 text-muted-foreground">
						<LuClock className="h-4 w-4" />
						<span className="font-medium text-foreground">
							{lessonStart} - {lessonEnd}
						</span>
					</div>
					{locations && (
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<LuMapPin className="h-4 w-4" />
							<span className="font-medium text-foreground">{locations}</span>
						</div>
					)}
					{teachers && (
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<LuGraduationCap className="h-4 w-4" />
							<span className="font-medium text-foreground">{teachers}</span>
						</div>
					)}
					{isAbsenceNoticeEntry(entry) && (
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<LuUser className="h-4 w-4" />
							<span className="font-medium text-foreground">
								{[
									entry.notice.creator.initials,
									entry.notice.creator.infix,
									entry.notice.creator.lastName,
								]
									.filter((part) => part.trim())
									.join(' ')}
							</span>
						</div>
					)}
				</div>

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
