'use client';

import StudentItem from '@/components/student/StudentItem';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ReturnMeasureReportAction } from '@/lib/return-measure/report';
import type { Student } from '@/types/student.types';

const CONFIRM_COPY: Record<ReturnMeasureReportAction, { title: string; body: string }> = {
	reported: {
		title: 'Gemeld',
		body: 'Heeft deze leerling zich gemeld?',
	},
	'not-reported': {
		title: 'Niet gemeld',
		body: 'Heeft deze leerling zich NIET gemeld?',
	},
};

export interface ReturnMeasureReportConfirmModalProps {
	action: ReturnMeasureReportAction | null;
	student?: Student;
	studentName: string;
	classLabel?: string;
	photoUrl?: string;
	isSubmitting: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

function confirmCopy(action: ReturnMeasureReportAction | null) {
	if (action === null) return null;
	return CONFIRM_COPY[action];
}

function handleConfirmOpenChange(open: boolean, isSubmitting: boolean, onCancel: () => void) {
	if (open) return;
	if (isSubmitting) return;
	onCancel();
}

export default function ReturnMeasureReportConfirmModal(props: ReturnMeasureReportConfirmModalProps) {
	const copy = confirmCopy(props.action);

	return (
		<Dialog
			open={props.action !== null}
			onOpenChange={(open) => handleConfirmOpenChange(open, props.isSubmitting, props.onCancel)}
		>
			<DialogContent className="max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{copy?.title}</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<p className="text-sm text-muted-foreground">{copy?.body}</p>
					<StudentItem
						student={props.student}
						name={props.studentName}
						photoUrl={props.photoUrl}
						classLabel={props.classLabel}
						variant="card"
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={props.onCancel} disabled={props.isSubmitting}>
						Annuleren
					</Button>
					<Button onClick={props.onConfirm} disabled={props.isSubmitting}>
						OK
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
