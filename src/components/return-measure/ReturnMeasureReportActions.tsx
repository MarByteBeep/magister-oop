'use client';

import { LuCheck, LuX } from 'react-icons/lu';
import ReturnMeasureReportConfirmModal from '@/components/return-measure/ReturnMeasureReportConfirmModal';
import { Button } from '@/components/ui/button';
import { useReturnMeasureReportConfirm } from '@/hooks/return-measure/useReturnMeasureReportConfirm';
import { returnMeasurePlanning, returnMeasureReportStatus } from '@/lib/return-measure/overview';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

interface ReturnMeasureReportActionsProps {
	measure: ReturnMeasureStudent;
	student?: Student;
	studentName: string;
	classLabel?: string;
}

export default function ReturnMeasureReportActions({
	measure,
	student,
	studentName,
	classLabel,
}: ReturnMeasureReportActionsProps) {
	const { setPendingAction, modalProps } = useReturnMeasureReportConfirm(measure, student, studentName, classLabel);

	if (returnMeasurePlanning(measure) !== 'open' || returnMeasureReportStatus(measure) !== 'none') return null;

	return (
		<>
			<fieldset className="m-0 flex shrink-0 items-center gap-1 border-0 p-0">
				<legend className="sr-only">Gemeld?</legend>
				<Button
					type="button"
					variant="outline"
					size="icon-sm"
					className="rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary"
					aria-label="Gemeld"
					title="Gemeld"
					onClick={() => setPendingAction('reported')}
				>
					<LuCheck className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="outline"
					size="icon-sm"
					className="rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary"
					aria-label="Niet gemeld"
					title="Niet gemeld"
					onClick={() => setPendingAction('not-reported')}
				>
					<LuX className="h-4 w-4" />
				</Button>
			</fieldset>
			<ReturnMeasureReportConfirmModal {...modalProps} />
		</>
	);
}
