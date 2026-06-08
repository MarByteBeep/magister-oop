'use client';

import { useState } from 'react';
import LazyAvatar from '@/components/LazyAvatar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudentsContext } from '@/context/StudentsContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useTardyModalAgenda } from '@/hooks/useTardyModalAgenda';
import { findAgendaItem } from '@/lib/agendaUtils';
import { submitTardyAccountability } from '@/lib/tardyUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
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
	const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
	const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

	const studentId = student?.id;
	const { agendaItems, isLoading } = useTardyModalAgenda(isOpen, studentId, students, loadAgendaForStudent);

	const fullName = student ? `${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}`.trim() : '';
	const activeAgendaItem = findAgendaItem(currentTime, agendaItems);

	const handleItemClick = (item: AgendaItem) => {
		setSelectedItem(item);
		setIsConfirmationOpen(true);
	};

	const handleConfirm = async () => {
		if (!selectedItem || !studentId) return;
		const ok = await submitTardyAccountability(studentId, selectedItem);
		if (ok) {
			setIsConfirmationOpen(false);
			setSelectedItem(null);
		}
	};

	const handleCancel = () => {
		setIsConfirmationOpen(false);
		setSelectedItem(null);
	};

	const sortedItems = [...agendaItems].sort((a, b) => (a.lesuur?.begin ?? 99) - (b.lesuur?.begin ?? 99));

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
						<DialogDescription>
							Overzicht van alle afspraken voor vandaag met lesuur en onderwerp.
						</DialogDescription>
					</DialogHeader>

					{isLoading ? (
						<div className="flex justify-center items-center py-8">
							<LoadingSpinner iconClassName="h-6 w-6" />
						</div>
					) : agendaItems.length === 0 ? (
						<p className="text-muted-foreground text-center py-8">Geen afspraken voor vandaag</p>
					) : (
						<ScrollArea className="flex-1 pr-4 min-h-0">
							<div className="grid grid-cols-2 gap-2">
								{sortedItems.map((item) => (
									<TardyAgendaItem
										key={item.id}
										item={item}
										currentTime={currentTime}
										isCurrent={activeAgendaItem?.id === item.id}
										onSelect={handleItemClick}
									/>
								))}
							</div>
						</ScrollArea>
					)}
				</DialogContent>
			</Dialog>

			{selectedItem && (
				<TardyConfirmationModal
					item={selectedItem}
					studentName={fullName}
					isOpen={isConfirmationOpen}
					onConfirm={handleConfirm}
					onCancel={handleCancel}
				/>
			)}
		</>
	);
}
