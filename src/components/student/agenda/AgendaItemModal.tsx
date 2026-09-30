'use client';

import { useState } from 'react';
import ReturnMeasureModal from '@/components/return-measure/ReturnMeasureModal';
import AbsenceNoticeDeleteConfirmModal from '@/components/student/agenda/AbsenceNoticeDeleteConfirmModal';
import AgendaItemModalMetadata from '@/components/student/agenda/AgendaItemModalMetadata';
import AgendaItemStudentsList from '@/components/student/agenda/AgendaItemStudentsList';
import LessonHourBadge from '@/components/student/agenda/LessonHourBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStudentsContext } from '@/context/StudentsContext';
import { useAgendaItemStudents } from '@/hooks/agenda/useAgendaItemStudents';
import { deleteAbsenceNotice } from '@/lib/absence-notice/delete';
import { absenceNoticeRangeEndMs } from '@/lib/absence-notice/utils';
import { isAbsenceNoticeEntry, isLessonEntry, isReturnMeasureEntry } from '@/lib/agenda/entryUtils';
import { getAgendaItemInfo } from '@/lib/agenda/utils';
import { eachDateKey, getDateKey } from '@/lib/shared/dateUtils';
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
	const absenceEntry = isAbsenceNoticeEntry(entry) ? entry : null;
	const { courseDescriptions, courseCodes, teachers, locations } = lessonEntry
		? getAgendaItemInfo(lessonEntry.item)
		: { courseDescriptions: undefined, courseCodes: undefined, teachers: undefined, locations: undefined };
	const { lessonStart, lessonEnd, hasLocation, studentsInLocation } = useAgendaItemStudents(entry, students);
	const title = resolveStandardModalTitle(entry);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleConfirmDelete = async () => {
		if (!absenceEntry || isDeleting) return;
		setIsDeleting(true);
		const dateKeys = eachDateKey(
			new Date(absenceEntry.notice.startDateTime),
			new Date(absenceNoticeRangeEndMs(absenceEntry.notice)),
		);
		const ok = await deleteAbsenceNotice(
			absenceEntry.notice.student.id,
			absenceEntry.notice.absenceNoticeId,
			dateKeys.length > 0 ? dateKeys : [getDateKey(new Date(absenceEntry.notice.startDateTime))],
		);
		setIsDeleting(false);
		if (ok) {
			setConfirmDelete(false);
			onClose();
		}
	};

	return (
		<>
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
							{absenceEntry && (
								<Badge variant="secondary">{absenceEntry.notice.attendanceTypeCode}</Badge>
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

					{absenceEntry && (
						<DialogFooter>
							<Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
								Verwijderen
							</Button>
						</DialogFooter>
					)}
				</DialogContent>
			</Dialog>

			<AbsenceNoticeDeleteConfirmModal
				notice={confirmDelete && absenceEntry ? absenceEntry.notice : null}
				isSubmitting={isDeleting}
				onConfirm={() => void handleConfirmDelete()}
				onCancel={() => setConfirmDelete(false)}
			/>
		</>
	);
}
