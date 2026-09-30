'use client';

import { useState } from 'react';
import ReturnMeasureReportConfirmModal from '@/components/return-measures/ReturnMeasureReportConfirmModal';
import { Button } from '@/components/ui/button';
import type { ReturnMeasureReportStatus } from '@/lib/return-measure/overview';
import { type ReturnMeasureReportAction, submitReturnMeasureReport } from '@/lib/return-measure/report';
import {
	notReportedHoverClasses,
	notReportedSolidClasses,
	reportedHoverClasses,
	reportedSolidClasses,
} from '@/lib/return-measure/reportStyles';
import { cn } from '@/lib/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

interface ReturnMeasureReportButtonsProps {
	measure: ReturnMeasureStudent;
	reportStatus: ReturnMeasureReportStatus;
	student?: Student;
	studentName: string;
	classLabel?: string;
	onReportStatusChange: (status: Exclude<ReturnMeasureReportStatus, 'none'>) => void;
}

export default function ReturnMeasureReportButtons({
	measure,
	reportStatus,
	student,
	studentName,
	classLabel,
	onReportStatusChange,
}: ReturnMeasureReportButtonsProps) {
	const photoUrl = student?.links.foto?.href ?? measure.leerling.links.foto?.href;
	const [pendingAction, setPendingAction] = useState<ReturnMeasureReportAction | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isReported = reportStatus === 'reported';
	const isNotReported = reportStatus === 'not-reported';

	async function confirmReport() {
		if (pendingAction == null || isSubmitting) return;
		setIsSubmitting(true);
		try {
			const ok = await submitReturnMeasureReport(measure, pendingAction);
			if (ok) onReportStatusChange(pendingAction);
		} finally {
			setIsSubmitting(false);
			setPendingAction(null);
		}
	}

	return (
		<>
			<div className="flex flex-wrap items-center justify-end gap-2">
				<Button
					type="button"
					variant={isReported ? 'default' : 'outline'}
					disabled={isReported || isSubmitting}
					aria-pressed={isReported}
					className={cn(isReported ? cn(reportedSolidClasses, 'disabled:opacity-100') : reportedHoverClasses)}
					onClick={() => setPendingAction('reported')}
				>
					Gemeld
				</Button>
				<Button
					type="button"
					variant={isNotReported ? 'destructive' : 'outline'}
					disabled={isNotReported || isSubmitting}
					aria-pressed={isNotReported}
					className={cn(
						isNotReported ? cn(notReportedSolidClasses, 'disabled:opacity-100') : notReportedHoverClasses,
					)}
					onClick={() => setPendingAction('not-reported')}
				>
					Niet gemeld
				</Button>
			</div>
			<ReturnMeasureReportConfirmModal
				action={pendingAction}
				student={student}
				studentName={studentName}
				classLabel={classLabel ?? measure.leerling.stamklas.code}
				photoUrl={photoUrl}
				isSubmitting={isSubmitting}
				onConfirm={() => void confirmReport()}
				onCancel={() => setPendingAction(null)}
			/>
		</>
	);
}
