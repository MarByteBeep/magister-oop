'use client';

import LazyAvatar from '@/components/LazyAvatar';
import LoadingSpinner from '@/components/LoadingSpinner';
import TardyAgendaItem from '@/components/student/tardy/TardyAgendaItem';
import TardyConfirmationModal from '@/components/student/tardy/TardyConfirmationModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTardyModal } from '@/hooks/agenda/useTardyModal';
import { getAgendaEntryKey, isLessonEntry, isSameAgendaEntryOccurrence } from '@/lib/agenda/entryUtils';
import { closeWhenDismissed } from '@/lib/shared/dialogUtils';
import type { AgendaEntry, LessonAgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

export interface TardyModalProps {
	student?: Student;
	isOpen: boolean;
	onClose: () => void;
}

function asLessonEntry(entry: AgendaEntry | null): LessonAgendaEntry | null {
	if (!entry) return null;
	if (!isLessonEntry(entry)) return null;
	return entry;
}

function lessonBeginOrLast(entry: LessonAgendaEntry): number {
	return entry.item.lesuur?.begin ?? 99;
}

function compareLessonBegin(a: LessonAgendaEntry, b: LessonAgendaEntry): number {
	return lessonBeginOrLast(a) - lessonBeginOrLast(b);
}

function sortLessonEntriesByBegin(entries: LessonAgendaEntry[]): LessonAgendaEntry[] {
	return [...entries].sort(compareLessonBegin);
}

function StudentAvatar({ student, fullName }: { student: Student; fullName: string }) {
	return (
		<LazyAvatar
			src={student.links.foto?.href || undefined}
			alt={fullName}
			initials={`${student.roepnaam.charAt(0)}${student.achternaam.charAt(0)}`.toUpperCase()}
			className="h-10 w-10"
		/>
	);
}

function TardyModalHeader({ student, fullName }: { student: Student | undefined; fullName: string }) {
	return (
		<DialogHeader>
			<DialogTitle className="flex items-center gap-3">
				{student ? <StudentAvatar student={student} fullName={fullName} /> : null}
				<span>{fullName} - Te laat melding</span>
			</DialogTitle>
		</DialogHeader>
	);
}

function TardyLessonGrid({
	lessonEntries,
	currentTime,
	activeEntry,
	onSelect,
}: {
	lessonEntries: LessonAgendaEntry[];
	currentTime: Date;
	activeEntry: AgendaEntry | null | undefined;
	onSelect: (entry: AgendaEntry) => void;
}) {
	const sortedEntries = sortLessonEntriesByBegin(lessonEntries);
	return (
		<ScrollArea className="flex-1 pr-4 min-h-0">
			<div className="grid grid-cols-2 gap-2">
				{sortedEntries.map((entry) => (
					<TardyAgendaItem
						key={getAgendaEntryKey(entry)}
						entry={entry}
						currentTime={currentTime}
						isCurrent={isSameAgendaEntryOccurrence(activeEntry, entry)}
						onSelect={onSelect}
					/>
				))}
			</div>
		</ScrollArea>
	);
}

function TardyModalLessonList({
	isLoading,
	lessonEntries,
	currentTime,
	activeEntry,
	onSelect,
}: {
	isLoading: boolean;
	lessonEntries: LessonAgendaEntry[];
	currentTime: Date;
	activeEntry: AgendaEntry | null | undefined;
	onSelect: (entry: AgendaEntry) => void;
}) {
	if (isLoading) {
		return (
			<div className="flex justify-center items-center py-8">
				<LoadingSpinner iconClassName="h-6 w-6" />
			</div>
		);
	}
	if (lessonEntries.length === 0) {
		return <p className="text-muted-foreground text-center py-8">Geen afspraken voor vandaag</p>;
	}
	return (
		<TardyLessonGrid
			lessonEntries={lessonEntries}
			currentTime={currentTime}
			activeEntry={activeEntry}
			onSelect={onSelect}
		/>
	);
}

function TardyConfirmOverlay({
	selectedEntry,
	student,
	fullName,
	isOpen,
	onConfirm,
	onCancel,
}: {
	selectedEntry: AgendaEntry | null;
	student: Student | undefined;
	fullName: string;
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}) {
	const lesson = asLessonEntry(selectedEntry);
	if (!lesson) return null;
	return (
		<TardyConfirmationModal
			item={lesson.item}
			student={student}
			studentName={fullName}
			isOpen={isOpen}
			onConfirm={onConfirm}
			onCancel={onCancel}
		/>
	);
}

export default function TardyModal({ student, isOpen, onClose }: TardyModalProps) {
	const model = useTardyModal(isOpen, student, onClose);

	return (
		<>
			<Dialog open={isOpen} onOpenChange={closeWhenDismissed(onClose)}>
				<DialogContent
					className="max-w-[500px] max-h-[500px] flex flex-col"
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<TardyModalHeader student={student} fullName={model.fullName} />
					<TardyModalLessonList
						isLoading={model.isLoading}
						lessonEntries={model.lessonEntries}
						currentTime={model.currentTime}
						activeEntry={model.activeEntry}
						onSelect={model.handleItemClick}
					/>
				</DialogContent>
			</Dialog>
			<TardyConfirmOverlay
				selectedEntry={model.selectedEntry}
				student={student}
				fullName={model.fullName}
				isOpen={model.isConfirmationOpen}
				onConfirm={model.handleConfirm}
				onCancel={model.clearSelection}
			/>
		</>
	);
}
