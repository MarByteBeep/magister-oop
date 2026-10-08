import { submitReturnMeasure } from '@/lib/return-measure/create';
import type { CreateReturnMeasureFormInput } from '@/lib/return-measure/createRequest';
import { type ReturnMeasureReportAction, submitReturnMeasureReport } from '@/lib/return-measure/report';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

/** Mark the measure reported/not-reported, then optionally create the follow-up plan. */
export async function confirmReturnMeasureReport(
	measure: ReturnMeasureStudent,
	action: ReturnMeasureReportAction,
	plan: CreateReturnMeasureFormInput | null,
): Promise<boolean> {
	const reported = await submitReturnMeasureReport(measure, action);
	if (!reported) return false;
	if (plan) {
		await submitReturnMeasure(measure.leerling.id, plan);
	}
	return true;
}
