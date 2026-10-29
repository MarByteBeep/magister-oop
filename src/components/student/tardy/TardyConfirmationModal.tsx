'use client';

import { LuPrinter } from 'react-icons/lu';
import StudentItem from '@/components/student/StudentItem';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { printTardySlip } from '@/lib/agenda/tardySlip';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/types/student.types';

export interface TardyConfirmationModalProps {
	item: AgendaItem;
	student?: Student;
	studentName: string;
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

function lessonBegin(item: AgendaItem): number | undefined {
	if (!item.lesuur) return undefined;
	return item.lesuur.begin;
}

function lessonInfoLabel(item: AgendaItem): string {
	const begin = lessonBegin(item);
	if (!begin) return 'deze les';
	return `lesuur ${begin}`;
}

function subjectLabel(item: AgendaItem): string {
	if (!item.onderwerp) return 'deze les';
	return item.onderwerp;
}

function handleTardyOpenChange(open: boolean, onCancel: () => void) {
	if (open) return;
	onCancel();
}

export default function TardyConfirmationModal(props: TardyConfirmationModalProps) {
	const lessonInfo = lessonInfoLabel(props.item);
	const subject = subjectLabel(props.item);

	const handlePrint = () => {
		printTardySlip({ studentName: props.studentName, lessonInfo, subject });
	};

	return (
		<Dialog open={props.isOpen} onOpenChange={(open) => handleTardyOpenChange(open, props.onCancel)}>
			<DialogContent className="max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Te laat melding aanmaken</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<p className="text-sm text-muted-foreground">
						Weet je zeker dat je een te laat melding wilt aanmaken voor {lessonInfo} ({subject})?
					</p>
					<StudentItem
						student={props.student}
						name={props.studentName}
						description={`${lessonInfo} · ${subject}`}
						variant="card"
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={handlePrint}>
						<LuPrinter className="h-4 w-4" />
						Afdrukken
					</Button>
					<Button variant="outline" onClick={props.onCancel}>
						Annuleren
					</Button>
					<Button onClick={props.onConfirm}>OK</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
