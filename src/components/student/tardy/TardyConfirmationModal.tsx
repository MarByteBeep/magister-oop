'use client';

import { LuPrinter } from 'react-icons/lu';
import StudentItem from '@/components/student/StudentItem';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { printTardySlip } from '@/lib/agenda/tardySlip';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/types/student.types';

interface TardyConfirmationModalProps {
	item: AgendaItem;
	student?: Student;
	studentName: string;
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function TardyConfirmationModal({
	item,
	student,
	studentName,
	isOpen,
	onConfirm,
	onCancel,
}: TardyConfirmationModalProps) {
	const lessonInfo = item.lesuur?.begin ? `lesuur ${item.lesuur.begin}` : 'deze les';
	const subject = item.onderwerp || 'deze les';

	const handlePrint = () => {
		printTardySlip({ studentName, lessonInfo, subject });
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent className="max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Te laat melding aanmaken</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<p className="text-sm text-muted-foreground">
						Weet je zeker dat je een te laat melding wilt aanmaken voor {lessonInfo} ({subject})?
					</p>
					<StudentItem
						student={student}
						name={studentName}
						description={`${lessonInfo} · ${subject}`}
						variant="card"
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={handlePrint}>
						<LuPrinter className="h-4 w-4" />
						Afdrukken
					</Button>
					<Button variant="outline" onClick={onCancel}>
						Annuleren
					</Button>
					<Button onClick={onConfirm}>OK</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
