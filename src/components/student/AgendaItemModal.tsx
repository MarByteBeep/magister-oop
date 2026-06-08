'use client';

import { LuClock, LuGraduationCap, LuMapPin } from 'react-icons/lu';
import LessonHourBadge from '@/components/LessonHourBadge';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStudentsContext } from '@/context/StudentsContext';
import { useAgendaItemStudents } from '@/hooks/useAgendaItemStudents';
import { getAgendaItemInfo } from '@/lib/agendaUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';
import AgendaItemStudentsList from './AgendaItemStudentsList';

interface AgendaItemModalProps {
	item: AgendaItem;
	isOpen: boolean;
	onClose: () => void;
	onOpenStudent?: (student: Student) => void;
}

export default function AgendaItemModal({ item, isOpen, onClose, onOpenStudent }: AgendaItemModalProps) {
	const { students } = useStudentsContext();
	const { courseDescriptions, courseCodes, teachers, locations, subject } = getAgendaItemInfo(item);
	const { lessonStart, lessonEnd, hasLocation, studentsInLocation } = useAgendaItemStudents(item, students);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-[800px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{item.lesuur?.begin && (
							<LessonHourBadge
								lessonInfo={{ status: 'lesson', lesson: item.lesuur.begin }}
								className="h-7 w-7 text-sm"
							/>
						)}
						<span>{courseDescriptions ?? subject ?? 'Agenda item'}</span>
						{courseCodes && courseCodes !== courseDescriptions && (
							<Badge variant="secondary">{courseCodes}</Badge>
						)}
					</DialogTitle>
					<DialogDescription>Agenda item details en leerlingen in hetzelfde lokaal.</DialogDescription>
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
				</div>

				{item.opmerking && (
					<div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">{item.opmerking}</div>
				)}

				{hasLocation && (
					<AgendaItemStudentsList studentsByClass={studentsInLocation} onOpenStudent={onOpenStudent} />
				)}
			</DialogContent>
		</Dialog>
	);
}
