import { useState } from 'react';
import { useStudentsContext } from '@/context/StudentsContext';
import { useTardyModalAgenda } from '@/hooks/agenda/useTardyModalAgenda';
import { useCurrentTime } from '@/hooks/shared/useCurrentTime';
import { findLessonEntry, isLessonEntry } from '@/lib/agenda/entryUtils';
import { submitTardyAccountability } from '@/lib/agenda/tardyUtils';
import { getNow } from '@/lib/shared/dateUtils';
import type { AgendaEntry, LessonAgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

function studentFullName(
	student: { roepnaam: string; tussenvoegsel?: string | null; achternaam: string } | undefined,
): string {
	if (!student) return '';
	return `${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}`.trim();
}

function asLessonEntry(entry: AgendaEntry | null): LessonAgendaEntry | null {
	if (!entry) return null;
	if (!isLessonEntry(entry)) return null;
	return entry;
}

type LoadAgenda = (studentId: number, start: Date, end: Date, options?: { refresh?: boolean }) => Promise<unknown>;

async function refreshAgendaAfterTardy(studentId: number, loadAgendaForStudent: LoadAgenda): Promise<boolean> {
	const today = getNow();
	await loadAgendaForStudent(studentId, today, today, { refresh: true });
	return true;
}

async function submitTardyForLesson(
	studentId: number,
	lesson: LessonAgendaEntry,
	loadAgendaForStudent: LoadAgenda,
): Promise<boolean> {
	const ok = await submitTardyAccountability(studentId, lesson.item);
	if (!ok) return false;
	return refreshAgendaAfterTardy(studentId, loadAgendaForStudent);
}

async function finishTardyForStudent(
	lesson: LessonAgendaEntry,
	args: {
		studentId: number | undefined;
		loadAgendaForStudent: LoadAgenda;
		onSuccess: () => void;
	},
): Promise<void> {
	if (args.studentId === undefined) return;
	const done = await submitTardyForLesson(args.studentId, lesson, args.loadAgendaForStudent);
	if (!done) return;
	args.onSuccess();
}

async function confirmTardySubmission(args: {
	selectedEntry: AgendaEntry | null;
	studentId: number | undefined;
	loadAgendaForStudent: LoadAgenda;
	onSuccess: () => void;
}): Promise<void> {
	const lesson = asLessonEntry(args.selectedEntry);
	if (!lesson) return;
	await finishTardyForStudent(lesson, args);
}

export function useTardyModal(isOpen: boolean, student: Student | undefined, onClose: () => void) {
	const { students, loadAgendaForStudent } = useStudentsContext();
	const currentTime = useCurrentTime();
	const [selectedEntry, setSelectedEntry] = useState<AgendaEntry | null>(null);
	const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
	const studentId = student?.id;
	const { agendaEntries, isLoading } = useTardyModalAgenda(isOpen, studentId, students, loadAgendaForStudent);

	const clearSelection = () => {
		setIsConfirmationOpen(false);
		setSelectedEntry(null);
	};

	const handleItemClick = (entry: AgendaEntry) => {
		if (!isLessonEntry(entry)) return;
		setSelectedEntry(entry);
		setIsConfirmationOpen(true);
	};

	const handleConfirm = () => {
		void confirmTardySubmission({
			selectedEntry,
			studentId,
			loadAgendaForStudent,
			onSuccess: () => {
				clearSelection();
				onClose();
			},
		});
	};

	return {
		currentTime,
		selectedEntry,
		isConfirmationOpen,
		isLoading,
		lessonEntries: agendaEntries.filter(isLessonEntry),
		fullName: studentFullName(student),
		activeEntry: findLessonEntry(currentTime, agendaEntries),
		handleItemClick,
		handleConfirm,
		clearSelection,
	};
}
