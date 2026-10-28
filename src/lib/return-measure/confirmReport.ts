import { toast } from 'sonner';
import { submitReturnMeasure } from '@/lib/return-measure/create';
import type { CreateReturnMeasureFormInput } from '@/lib/return-measure/createRequest';
import { type ReturnMeasureReportAction, submitReturnMeasureReport } from '@/lib/return-measure/report';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

/** Mark the measure reported/not-reported, then create each follow-up plan (stop on first failure). */
export async function confirmReturnMeasureReport(
	measure: ReturnMeasureStudent,
	action: ReturnMeasureReportAction,
	plans: CreateReturnMeasureFormInput[],
): Promise<boolean> {
	const reported = await submitReturnMeasureReport(measure, action);
	if (!reported) return false;

	for (const plan of plans) {
		const created = await submitReturnMeasure(measure.leerling.id, plan, { successToast: false });
		if (!created) return false;
	}

	if (plans.length === 1) {
		toast.success('Terugkommaatregel succesvol aangemaakt');
	} else if (plans.length > 1) {
		toast.success(`${plans.length} terugkommaatregelen succesvol aangemaakt`);
	}

	return true;
}
