'use client';

import LessonHourBadge from '@/components/student/agenda/calendar/LessonHourBadge';
import AbsenceNoticeDeleteConfirmModal from '@/components/student/agenda/item-modal/AbsenceNoticeDeleteConfirmModal';
import AgendaItemModalMetadata from '@/components/student/agenda/item-modal/AgendaItemModalMetadata';
import AgendaItemStudentsList from '@/components/student/agenda/item-modal/AgendaItemStudentsList';
import type { LessonAgendaInfo } from '@/components/student/agenda/item-modal/standardAgendaItemModalModel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStandardAgendaItemModal } from '@/hooks/agenda/useStandardAgendaItemModal';
import { closeWhenDismissed } from '@/lib/shared/dialogUtils';
import type { AbsenceNoticeAgendaEntry, AgendaEntry, LessonAgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

export interface StandardAgendaItemModalProps {
	entry: AgendaEntry;
	isOpen: boolean;
	onClose: () => void;
	onOpenStudent?: (student: Student) => void;
}

function AbsenceDeleteFooter({
	absenceEntry,
	onDelete,
}: {
	absenceEntry: AbsenceNoticeAgendaEntry | null;
	onDelete: () => void;
}) {
	if (!absenceEntry) return null;
	return (
		<DialogFooter>
			<Button type="button" variant="destructive" onClick={onDelete}>
				Verwijderen
			</Button>
		</DialogFooter>
	);
}

function lessonHourBegin(lessonEntry: LessonAgendaEntry | null): number | undefined {
	if (!lessonEntry) return undefined;
	const lessonHour = lessonEntry.item.lesuur;
	if (!lessonHour) return undefined;
	return lessonHour.begin;
}

function LessonHourPrefix({ lessonEntry }: { lessonEntry: LessonAgendaEntry | null }) {
	const begin = lessonHourBegin(lessonEntry);
	if (!begin) return null;
	return (
		<LessonHourBadge
			lessonInfo={{
				status: 'lesson',
				lesson: begin,
			}}
			className="h-7 w-7 text-sm"
		/>
	);
}

function AbsenceTypeBadge({ absenceEntry }: { absenceEntry: AbsenceNoticeAgendaEntry | null }) {
	if (!absenceEntry) return null;
	return <Badge variant="secondary">{absenceEntry.notice.attendanceTypeCode}</Badge>;
}

function showCourseCodeBadge(lessonInfo: LessonAgendaInfo): boolean {
	if (!lessonInfo.courseCodes) return false;
	return lessonInfo.courseCodes !== lessonInfo.courseDescriptions;
}

function CourseCodeBadge({
	lessonEntry,
	lessonInfo,
}: {
	lessonEntry: LessonAgendaEntry | null;
	lessonInfo: LessonAgendaInfo;
}) {
	if (!lessonEntry) return null;
	if (!showCourseCodeBadge(lessonInfo)) return null;
	return <Badge variant="secondary">{lessonInfo.courseCodes}</Badge>;
}

function StandardAgendaItemModalHeader({
	title,
	lessonEntry,
	absenceEntry,
	lessonInfo,
}: {
	title: string;
	lessonEntry: LessonAgendaEntry | null;
	absenceEntry: AbsenceNoticeAgendaEntry | null;
	lessonInfo: LessonAgendaInfo;
}) {
	return (
		<DialogHeader>
			<DialogTitle className="flex items-center gap-2">
				<LessonHourPrefix lessonEntry={lessonEntry} />
				<span>{title}</span>
				<AbsenceTypeBadge absenceEntry={absenceEntry} />
				<CourseCodeBadge lessonEntry={lessonEntry} lessonInfo={lessonInfo} />
			</DialogTitle>
		</DialogHeader>
	);
}

function lessonRemarkOf(lessonEntry: LessonAgendaEntry | null): string | undefined {
	if (!lessonEntry) return undefined;
	return lessonEntry.item.opmerking ?? undefined;
}

function LessonRemark({ remark }: { remark: string | undefined }) {
	if (!remark) return null;
	return <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">{remark}</div>;
}

function LocationStudentsSection({
	lessonEntry,
	hasLocation,
	studentsInLocation,
	onOpenStudent,
}: {
	lessonEntry: LessonAgendaEntry | null;
	hasLocation: boolean;
	studentsInLocation: Record<string, Student[]>;
	onOpenStudent?: (student: Student) => void;
}) {
	if (!hasLocation) return null;
	if (!lessonEntry) return null;
	return <AgendaItemStudentsList studentsByClass={studentsInLocation} onOpenStudent={onOpenStudent} />;
}

function StandardAgendaItemModalBody({
	entry,
	lessonEntry,
	lessonStart,
	lessonEnd,
	locations,
	teachers,
	hasLocation,
	studentsInLocation,
	onOpenStudent,
}: {
	entry: AgendaEntry;
	lessonEntry: LessonAgendaEntry | null;
	lessonStart: string;
	lessonEnd: string;
	locations: string | undefined;
	teachers: string | undefined;
	hasLocation: boolean;
	studentsInLocation: Record<string, Student[]>;
	onOpenStudent?: (student: Student) => void;
}) {
	return (
		<>
			<AgendaItemModalMetadata
				entry={entry}
				lessonStart={lessonStart}
				lessonEnd={lessonEnd}
				locations={locations}
				teachers={teachers}
			/>
			<LessonRemark remark={lessonRemarkOf(lessonEntry)} />
			<LocationStudentsSection
				lessonEntry={lessonEntry}
				hasLocation={hasLocation}
				studentsInLocation={studentsInLocation}
				onOpenStudent={onOpenStudent}
			/>
		</>
	);
}

export default function StandardAgendaItemModal({
	entry,
	isOpen,
	onClose,
	onOpenStudent,
}: StandardAgendaItemModalProps) {
	const model = useStandardAgendaItemModal(entry, onClose);

	return (
		<>
			<Dialog open={isOpen} onOpenChange={closeWhenDismissed(onClose)}>
				<DialogContent className="max-w-[800px]">
					<StandardAgendaItemModalHeader
						title={model.title}
						lessonEntry={model.lessonEntry}
						absenceEntry={model.absenceEntry}
						lessonInfo={model.lessonInfo}
					/>
					<StandardAgendaItemModalBody
						entry={entry}
						lessonEntry={model.lessonEntry}
						lessonStart={model.agendaStudents.lessonStart}
						lessonEnd={model.agendaStudents.lessonEnd}
						locations={model.lessonInfo.locations}
						teachers={model.lessonInfo.teachers}
						hasLocation={model.agendaStudents.hasLocation}
						studentsInLocation={model.agendaStudents.studentsInLocation}
						onOpenStudent={onOpenStudent}
					/>
					<AbsenceDeleteFooter absenceEntry={model.absenceEntry} onDelete={model.requestDelete} />
				</DialogContent>
			</Dialog>
			<AbsenceNoticeDeleteConfirmModal
				notice={model.notice}
				isSubmitting={model.isDeleting}
				onConfirm={model.handleConfirmDelete}
				onCancel={model.cancelDelete}
			/>
		</>
	);
}
