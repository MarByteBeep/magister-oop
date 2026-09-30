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

interface ReturnMeasureReportConfirmModalProps {
	action: ReturnMeasureReportAction | null;
	student?: Student;
	studentName: string;
	classLabel?: string;
	photoUrl?: string;
	isSubmitting: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function ReturnMeasureReportConfirmModal({
	action,
	student,
	studentName,
	classLabel,
	photoUrl,
	isSubmitting,
	onConfirm,
	onCancel,
}: ReturnMeasureReportConfirmModalProps) {
	const copy = action == null ? null : CONFIRM_COPY[action];

	return (
		<Dialog open={action != null} onOpenChange={(open) => !open && !isSubmitting && onCancel()}>
			<DialogContent className="max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{copy?.title}</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<p className="text-sm text-muted-foreground">{copy?.body}</p>
					<StudentItem
						student={student}
						name={studentName}
						photoUrl={photoUrl}
						classLabel={classLabel}
						variant="card"
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
						Annuleren
					</Button>
					<Button onClick={onConfirm} disabled={isSubmitting}>
						OK
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
