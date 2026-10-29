import { useState } from 'react';
import {
	resolveLessonAgendaInfo,
	resolveStandardModalTitle,
} from '@/components/student/agenda/item-modal/standardAgendaItemModalModel';
import { useStudentsContext } from '@/context/StudentsContext';
import { useAgendaItemStudents } from '@/hooks/agenda/useAgendaItemStudents';
import { deleteAbsenceNotice } from '@/lib/absence-notice/delete';
import { absenceNoticeRangeEndMs } from '@/lib/absence-notice/utils';
import { isAbsenceNoticeEntry, isLessonEntry } from '@/lib/agenda/entryUtils';
import { eachDateKey, getDateKey } from '@/lib/shared/dateUtils';
import type { AbsenceNotice } from '@/magister/response/absenceNotice.types';
import type { AbsenceNoticeAgendaEntry, AgendaEntry, LessonAgendaEntry } from '@/magister/response/agendaEntry.types';

function lessonEntryOf(entry: AgendaEntry): LessonAgendaEntry | null {
	if (!isLessonEntry(entry)) return null;
	return entry;
}

function absenceEntryOf(entry: AgendaEntry): AbsenceNoticeAgendaEntry | null {
	if (!isAbsenceNoticeEntry(entry)) return null;
	return entry;
}

function absenceNoticeDateKeys(entry: AbsenceNoticeAgendaEntry): string[] {
	const dateKeys = eachDateKey(new Date(entry.notice.startDateTime), new Date(absenceNoticeRangeEndMs(entry.notice)));
	if (dateKeys.length > 0) return dateKeys;
	return [getDateKey(new Date(entry.notice.startDateTime))];
}

async function deleteAbsenceNoticeEntry(entry: AbsenceNoticeAgendaEntry): Promise<boolean> {
	return deleteAbsenceNotice(entry.notice.student.id, entry.notice.absenceNoticeId, absenceNoticeDateKeys(entry));
}

function absenceNoticeForConfirm(
	confirmDelete: boolean,
	absenceEntry: AbsenceNoticeAgendaEntry | null,
): AbsenceNotice | null {
	if (!confirmDelete) return null;
	if (!absenceEntry) return null;
	return absenceEntry.notice;
}

function canStartAbsenceDelete(
	absenceEntry: AbsenceNoticeAgendaEntry | null,
	isDeleting: boolean,
): absenceEntry is AbsenceNoticeAgendaEntry {
	if (isDeleting) return false;
	return absenceEntry !== null;
}

function applyAbsenceDeleteResult(ok: boolean, setConfirmDelete: (value: boolean) => void, onClose: () => void): void {
	if (!ok) return;
	setConfirmDelete(false);
	onClose();
}

async function runAbsenceNoticeDeleteFlow(args: {
	absenceEntry: AbsenceNoticeAgendaEntry | null;
	isDeleting: boolean;
	setIsDeleting: (value: boolean) => void;
	setConfirmDelete: (value: boolean) => void;
	onClose: () => void;
}): Promise<void> {
	const { absenceEntry, isDeleting, setIsDeleting, setConfirmDelete, onClose } = args;
	if (!canStartAbsenceDelete(absenceEntry, isDeleting)) return;
	setIsDeleting(true);
	const ok = await deleteAbsenceNoticeEntry(absenceEntry);
	setIsDeleting(false);
	applyAbsenceDeleteResult(ok, setConfirmDelete, onClose);
}

export function useStandardAgendaItemModal(entry: AgendaEntry, onClose: () => void) {
	const { students } = useStudentsContext();
	const lessonEntry = lessonEntryOf(entry);
	const absenceEntry = absenceEntryOf(entry);
	const lessonInfo = resolveLessonAgendaInfo(lessonEntry);
	const agendaStudents = useAgendaItemStudents(entry, students);
	const title = resolveStandardModalTitle(entry);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleConfirmDelete = () => {
		void runAbsenceNoticeDeleteFlow({
			absenceEntry,
			isDeleting,
			setIsDeleting,
			setConfirmDelete,
			onClose,
		});
	};

	return {
		lessonEntry,
		absenceEntry,
		lessonInfo,
		agendaStudents,
		title,
		isDeleting,
		notice: absenceNoticeForConfirm(confirmDelete, absenceEntry),
		requestDelete: () => setConfirmDelete(true),
		cancelDelete: () => setConfirmDelete(false),
		handleConfirmDelete,
	};
}
