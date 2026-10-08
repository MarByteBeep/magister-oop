'use client';

import { useEffect, useState } from 'react';
import ReturnMeasureReschedulePlanner from '@/components/return-measure/ReturnMeasureReschedulePlanner';
import StudentItem from '@/components/student/StudentItem';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { CreateReturnMeasureFormInput } from '@/lib/return-measure/createRequest';
import type { ReturnMeasureReportAction } from '@/lib/return-measure/report';
import { cn } from '@/lib/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

const CONFIRM_COPY: Record<ReturnMeasureReportAction, { title: string; body?: string }> = {
	reported: {
		title: 'Gemeld',
		body: 'Heeft deze leerling zich gemeld?',
	},
	'not-reported': {
		title: 'Niet gemeld',
	},
};

interface ReturnMeasureReportConfirmModalProps {
	action: ReturnMeasureReportAction | null;
	measure: ReturnMeasureStudent;
	student?: Student;
	studentName: string;
	classLabel?: string;
	photoUrl?: string;
	isSubmitting: boolean;
	onConfirm: (plan: CreateReturnMeasureFormInput | null) => void;
	onCancel: () => void;
}

export default function ReturnMeasureReportConfirmModal({
	action,
	measure,
	student,
	studentName,
	classLabel,
	photoUrl,
	isSubmitting,
	onConfirm,
	onCancel,
}: ReturnMeasureReportConfirmModalProps) {
	const copy = action == null ? null : CONFIRM_COPY[action];
	const isNotReported = action === 'not-reported';
	const [planEnabled, setPlanEnabled] = useState(true);
	const [plan, setPlan] = useState<CreateReturnMeasureFormInput | null>(null);

	useEffect(() => {
		if (action == null) {
			setPlanEnabled(true);
			setPlan(null);
		}
	}, [action]);

	const canConfirm = !isNotReported || !planEnabled || plan != null;

	const studentChip = (
		<StudentItem
			student={student}
			name={studentName}
			photoUrl={photoUrl}
			classLabel={classLabel}
			variant="plain"
			className="min-w-0"
		/>
	);

	const showPlanner = isNotReported && planEnabled;

	return (
		<Dialog open={action != null} onOpenChange={(open) => !open && !isSubmitting && onCancel()}>
			<DialogContent
				className={cn(
					'!flex flex-col gap-3',
					showPlanner
						? 'max-h-[90vh] w-[min(1100px,calc(100vw-2rem))] max-w-[1100px] overflow-y-auto'
						: 'max-w-[500px]',
				)}
			>
				{isNotReported ? (
					<>
						<DialogHeader className="shrink-0 space-y-2 pr-8 text-left">
							<DialogTitle className="text-xl">{copy?.title}</DialogTitle>
							{studentChip}
						</DialogHeader>

						<div className="flex shrink-0 items-center gap-2">
							<Checkbox
								id="plan-new-return-measure"
								checked={planEnabled}
								disabled={isSubmitting}
								onCheckedChange={(checked) => {
									const next = checked === true;
									setPlanEnabled(next);
									if (!next) setPlan(null);
								}}
							/>
							<Label htmlFor="plan-new-return-measure" className="text-sm font-medium">
								Nieuwe terugkommaatregel plannen
							</Label>
						</div>

						{showPlanner ? (
							<ReturnMeasureReschedulePlanner measure={measure} enabled onPlanChange={setPlan} />
						) : null}
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>{copy?.title}</DialogTitle>
						</DialogHeader>
						<div className="space-y-3">
							{copy?.body ? <p className="text-sm text-muted-foreground">{copy.body}</p> : null}
							{studentChip}
						</div>
					</>
				)}

				<DialogFooter className="shrink-0">
					<Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
						Annuleren
					</Button>
					<Button onClick={() => onConfirm(showPlanner ? plan : null)} disabled={isSubmitting || !canConfirm}>
						OK
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
