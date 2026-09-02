'use client';

import { useState } from 'react';
import LazyAvatar from '@/components/LazyAvatar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudentsContext } from '@/context/StudentsContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useTardyModalAgenda } from '@/hooks/useTardyModalAgenda';
import { findLessonEntry, getAgendaEntryKey, isLessonEntry, isSameAgendaEntryOccurrence } from '@/lib/agendaEntryUtils';
import { submitTardyAccountability } from '@/lib/tardyUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/magister/types';
import TardyAgendaItem from './TardyAgendaItem';
import TardyConfirmationModal from './TardyConfirmationModal';

interface TardyModalProps {
	student?: Student;
	isOpen: boolean;
	onClose: () => void;
}

export default function TardyModal({ student, isOpen, onClose }: TardyModalProps) {
	const { students, loadAgendaForStudent } = useStudentsContext();
	const currentTime = useCurrentTime();
	const [selectedEntry, setSelectedEntry] = useState<AgendaEntry | null>(null);
	const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

	const studentId = student?.id;
	const { agendaEntries, isLoading } = useTardyModalAgenda(isOpen, studentId, students, loadAgendaForStudent);

	const lessonEntries = agendaEntries.filter(isLessonEntry);
	const fullName = student ? `${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}`.trim() : '';
	const activeEntry = findLessonEntry(currentTime, agendaEntries);

	const handleItemClick = (entry: AgendaEntry) => {
		if (!isLessonEntry(entry)) return;
		setSelectedEntry(entry);
		setIsConfirmationOpen(true);
	};

	const handleConfirm = async () => {
		if (!selectedEntry || !isLessonEntry(selectedEntry) || !studentId) return;
		const ok = await submitTardyAccountability(studentId, selectedEntry.item);
		if (ok) {
			setIsConfirmationOpen(false);
			setSelectedEntry(null);
		}
	};

	const handleCancel = () => {
		setIsConfirmationOpen(false);
		setSelectedEntry(null);
	};

	const sortedEntries = [...lessonEntries].sort(
		(a, b) => (a.item.lesuur?.begin ?? 99) - (b.item.lesuur?.begin ?? 99),
	);

	return (
		<>
			<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
				<DialogContent
					className="max-w-[500px] max-h-[500px] flex flex-col"
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-3">
							{student && (
								<LazyAvatar
									src={student.links.foto?.href || undefined}
									alt={fullName}
									initials={`${student.roepnaam.charAt(0)}${student.achternaam.charAt(0)}`.toUpperCase()}
									className="h-10 w-10"
								/>
							)}
							<span>{fullName} - Te laat melding</span>
						</DialogTitle>
					</DialogHeader>

					{isLoading ? (
						<div className="flex justify-center items-center py-8">
							<LoadingSpinner iconClassName="h-6 w-6" />
						</div>
					) : lessonEntries.length === 0 ? (
						<p className="text-muted-foreground text-center py-8">Geen afspraken voor vandaag</p>
					) : (
						<ScrollArea className="flex-1 pr-4 min-h-0">
							<div className="grid grid-cols-2 gap-2">
								{sortedEntries.map((entry) => (
									<TardyAgendaItem
										key={getAgendaEntryKey(entry)}
										entry={entry}
										currentTime={currentTime}
										isCurrent={isSameAgendaEntryOccurrence(activeEntry, entry)}
										onSelect={handleItemClick}
									/>
								))}
							</div>
						</ScrollArea>
					)}
				</DialogContent>
			</Dialog>

			{selectedEntry && isLessonEntry(selectedEntry) && (
				<TardyConfirmationModal
					item={selectedEntry.item}
					studentName={fullName}
					isOpen={isConfirmationOpen}
					onConfirm={handleConfirm}
					onCancel={handleCancel}
				/>
			)}
		</>
	);
}
