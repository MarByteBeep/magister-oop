'use client';

import ReturnMeasureReportConfirmModal from '@/components/return-measure/ReturnMeasureReportConfirmModal';
import { Button } from '@/components/ui/button';
import { useReturnMeasureReportConfirm } from '@/hooks/return-measure/useReturnMeasureReportConfirm';
import type { ReturnMeasureReportStatus } from '@/lib/return-measure/overview';
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
}

export default function ReturnMeasureReportButtons({
	measure,
	reportStatus,
	student,
	studentName,
	classLabel,
}: ReturnMeasureReportButtonsProps) {
	const { setPendingAction, isSubmitting, modalProps } = useReturnMeasureReportConfirm(
		measure,
		student,
		studentName,
		classLabel,
	);

	const isReported = reportStatus === 'reported';
	const isNotReported = reportStatus === 'not-reported';

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
			<ReturnMeasureReportConfirmModal {...modalProps} />
		</>
	);
}
