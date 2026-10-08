import { useState } from 'react';
import { confirmReturnMeasureReport } from '@/lib/return-measure/confirmReport';
import type { CreateReturnMeasureFormInput } from '@/lib/return-measure/createRequest';
import type { ReturnMeasureReportAction } from '@/lib/return-measure/report';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

export function useReturnMeasureReportConfirm(
	measure: ReturnMeasureStudent,
	student: Student | undefined,
	studentName: string,
	classLabel?: string,
) {
	const photoUrl = student?.links.foto?.href ?? measure.leerling.links.foto?.href;
	const [pendingAction, setPendingAction] = useState<ReturnMeasureReportAction | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function confirmReport(plan: CreateReturnMeasureFormInput | null) {
		if (pendingAction == null || isSubmitting) return;
		setIsSubmitting(true);
		try {
			await confirmReturnMeasureReport(measure, pendingAction, plan);
		} finally {
			setIsSubmitting(false);
			setPendingAction(null);
		}
	}

	return {
		pendingAction,
		setPendingAction,
		isSubmitting,
		confirmReport,
		cancelReport: () => setPendingAction(null),
		modalProps: {
			action: pendingAction,
			measure,
			student,
			studentName,
			classLabel: classLabel ?? measure.leerling.stamklas.code,
			photoUrl,
			isSubmitting,
			onConfirm: (plan: CreateReturnMeasureFormInput | null) => void confirmReport(plan),
			onCancel: () => setPendingAction(null),
		},
	};
}
