'use client';

import type { ReactNode } from 'react';
import ReturnMeasureReschedulePlanner from '@/components/return-measure/ReturnMeasureReschedulePlanner';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { CreateReturnMeasureFormInput } from '@/lib/return-measure/createRequest';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

interface ReturnMeasureNotReportedConfirmBodyProps {
	title: string;
	studentChip: ReactNode;
	measure: ReturnMeasureStudent;
	planEnabled: boolean;
	isSubmitting: boolean;
	onPlanEnabledChange: (enabled: boolean) => void;
	onPlansChange: (plans: CreateReturnMeasureFormInput[]) => void;
}

export default function ReturnMeasureNotReportedConfirmBody({
	title,
	studentChip,
	measure,
	planEnabled,
	isSubmitting,
	onPlanEnabledChange,
	onPlansChange,
}: ReturnMeasureNotReportedConfirmBodyProps) {
	return (
		<>
			<DialogHeader className="shrink-0 space-y-2 pr-8 text-left">
				<DialogTitle className="text-xl">{title}</DialogTitle>
				{studentChip}
			</DialogHeader>

			<div className="flex shrink-0 items-center gap-2">
				<Checkbox
					id="plan-new-return-measure"
					checked={planEnabled}
					disabled={isSubmitting}
					onCheckedChange={(checked) => onPlanEnabledChange(checked === true)}
				/>
				<Label htmlFor="plan-new-return-measure" className="text-sm font-medium">
					Nieuwe terugkommaatregel plannen
				</Label>
			</div>

			{planEnabled ? (
				<ReturnMeasureReschedulePlanner measure={measure} enabled onPlanChange={onPlansChange} />
			) : null}
		</>
	);
}
