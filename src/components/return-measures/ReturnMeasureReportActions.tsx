'use client';

import { useState } from 'react';
import { LuCheck, LuX } from 'react-icons/lu';
import ReturnMeasureReportConfirmModal from '@/components/return-measures/ReturnMeasureReportConfirmModal';
import { Button } from '@/components/ui/button';
import { type ReturnMeasureReportAction, submitReturnMeasureReport } from '@/lib/return-measure/report';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

interface ReturnMeasureReportActionsProps {
	measure: ReturnMeasureStudent;
	studentName: string;
}

export default function ReturnMeasureReportActions({ measure, studentName }: ReturnMeasureReportActionsProps) {
	const [pendingAction, setPendingAction] = useState<ReturnMeasureReportAction | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function confirmReport() {
		if (pendingAction == null || isSubmitting) return;
		setIsSubmitting(true);
		try {
			await submitReturnMeasureReport(measure, pendingAction);
		} finally {
			setIsSubmitting(false);
			setPendingAction(null);
		}
	}

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
			<ReturnMeasureReportConfirmModal
				action={pendingAction}
				studentName={studentName}
				isSubmitting={isSubmitting}
				onConfirm={() => void confirmReport()}
				onCancel={() => setPendingAction(null)}
			/>
		</>
	);
}
