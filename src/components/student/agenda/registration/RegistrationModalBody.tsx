'use client';

import { LuMessageSquare, LuPrinter } from 'react-icons/lu';
import RegistrationIcon from '@/components/registrations/RegistrationIcon';
import RegistrationModalDetails from '@/components/student/agenda/registration/RegistrationModalDetails';
import StudentItem from '@/components/student/StudentItem';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { RegistrationModalDisplay } from '@/lib/registrations/registrationModalDisplay';
import type { RegistrationAgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

function RegistrationModalComment({ comment }: { comment: string | undefined }) {
	if (!comment) return null;

	return (
		<div className="flex items-start gap-1.5 text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
			<LuMessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
			<span className="text-foreground">{comment}</span>
		</div>
	);
}

function studentClickHandler(
	student: Student,
	onOpenStudent: ((student: Student) => void) | undefined,
): (() => void) | undefined {
	if (!onOpenStudent) return undefined;
	return () => onOpenStudent(student);
}

function RegistrationModalStudent({
	student,
	onOpenStudent,
}: {
	student: Student | undefined;
	onOpenStudent?: (student: Student) => void;
}) {
	if (!student) return null;

	return (
		<StudentItem
			student={student}
			classLabel={student.klassen.join(', ')}
			variant="card"
			onClick={studentClickHandler(student, onOpenStudent)}
		/>
	);
}

function PrintTardySlipButton({
	canPrintTardySlip,
	isDeleting,
	onPrintTardySlip,
}: {
	canPrintTardySlip: boolean;
	isDeleting: boolean;
	onPrintTardySlip: () => void;
}) {
	if (!canPrintTardySlip) return null;

	return (
		<Button type="button" variant="outline" onClick={onPrintTardySlip} disabled={isDeleting}>
			<LuPrinter className="h-4 w-4" />
			Afdrukken
		</Button>
	);
}

function RegistrationModalFooter({
	canPrintTardySlip,
	isDeleting,
	onPrintTardySlip,
	onRequestDelete,
}: {
	canPrintTardySlip: boolean;
	isDeleting: boolean;
	onPrintTardySlip: () => void;
	onRequestDelete: () => void;
}) {
	return (
		<DialogFooter>
			<PrintTardySlipButton
				canPrintTardySlip={canPrintTardySlip}
				isDeleting={isDeleting}
				onPrintTardySlip={onPrintTardySlip}
			/>
			<Button type="button" variant="destructive" onClick={onRequestDelete} disabled={isDeleting}>
				Verwijderen
			</Button>
		</DialogFooter>
	);
}

export interface RegistrationModalBodyProps {
	entry: RegistrationAgendaEntry;
	student: Student | undefined;
	display: RegistrationModalDisplay;
	canPrintTardySlip: boolean;
	isDeleting: boolean;
	onOpenStudent?: (student: Student) => void;
	onPrintTardySlip: () => void;
	onRequestDelete: () => void;
}

export default function RegistrationModalBody({
	entry,
	student,
	display,
	canPrintTardySlip,
	isDeleting,
	onOpenStudent,
	onPrintTardySlip,
	onRequestDelete,
}: RegistrationModalBodyProps) {
	const { registration } = entry;

	return (
		<DialogContent className="max-w-[520px]">
			<DialogHeader>
				<DialogTitle className="flex items-start gap-2">
					<RegistrationIcon registration={registration} start={entry.start} end={entry.end} size="lg" />
					<span className="min-w-0">{registration.description}</span>
				</DialogTitle>
			</DialogHeader>

			<RegistrationModalStudent student={student} onOpenStudent={onOpenStudent} />
			<RegistrationModalDetails display={display} />
			<RegistrationModalComment comment={display.comment} />
			<RegistrationModalFooter
				canPrintTardySlip={canPrintTardySlip}
				isDeleting={isDeleting}
				onPrintTardySlip={onPrintTardySlip}
				onRequestDelete={onRequestDelete}
			/>
		</DialogContent>
	);
}
