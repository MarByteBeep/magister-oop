'use client';

import ReturnMeasureNotReportedConfirmBody from '@/components/return-measure/ReturnMeasureNotReportedConfirmBody';
import ReturnMeasureReportedConfirmBody from '@/components/return-measure/ReturnMeasureReportedConfirmBody';
import StudentItem from '@/components/student/StudentItem';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { useReturnMeasureReportConfirmPlan } from '@/hooks/return-measure/useReturnMeasureReportConfirmPlan';
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
	onConfirm: (plans: CreateReturnMeasureFormInput[]) => void;
	onCancel: () => void;
}

function confirmDialogClassName(showPlanner: boolean): string {
	return cn(
		'!flex flex-col gap-3',
		showPlanner ? 'max-h-[90vh] w-[min(1100px,calc(100vw-2rem))] max-w-[1100px] overflow-y-auto' : 'max-w-[500px]',
	);
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
	const plan = useReturnMeasureReportConfirmPlan(action);

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

	return (
		<Dialog open={action != null} onOpenChange={(open) => !open && !isSubmitting && onCancel()}>
			<DialogContent className={confirmDialogClassName(plan.showPlanner)}>
				{plan.isNotReported ? (
					<ReturnMeasureNotReportedConfirmBody
						title={copy?.title ?? ''}
						studentChip={studentChip}
						measure={measure}
						planEnabled={plan.planEnabled}
						isSubmitting={isSubmitting}
						onPlanEnabledChange={plan.setPlanEnabledAndClear}
						onPlansChange={plan.setPlans}
					/>
				) : (
					<ReturnMeasureReportedConfirmBody
						title={copy?.title ?? ''}
						body={copy?.body}
						studentChip={studentChip}
					/>
				)}

				<DialogFooter className="shrink-0">
					<Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
						Annuleren
					</Button>
					<Button onClick={() => onConfirm(plan.confirmPlans)} disabled={isSubmitting || !plan.canConfirm}>
						OK
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
