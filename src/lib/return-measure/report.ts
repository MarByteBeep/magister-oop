import { toast } from 'sonner';
import { bulkListRegistry } from '@/lib/bulk-lists/sources';
import { invalidateReturnMeasureCache } from '@/lib/return-measure/fetch';
import { getMonthKey, getNow, getTodayKey, parseOptionalDate } from '@/lib/shared/dateUtils';
import { putJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { ReturnMeasureReportRequest } from '@/magister/response/returnMeasureReport.types';

/** Internal report action; mapped to Magister body values `Tijdig` / `NietTijdig`. */
export type ReturnMeasureReportAction = 'reported' | 'not-reported';

const REPORT_REQUEST_TYPE: Record<ReturnMeasureReportAction, ReturnMeasureReportRequest['type']> = {
	reported: 'Tijdig',
	'not-reported': 'NietTijdig',
};

const REPORT_SUCCESS_MESSAGE: Record<ReturnMeasureReportAction, string> = {
	reported: 'Terugkommaatregel gemeld',
	'not-reported': 'Terugkommaatregel niet gemeld',
};

function monthKeysForMeasure(measure: ReturnMeasureStudent): string[] {
	const keys = new Set<string>([getMonthKey(getNow())]);
	const start = parseOptionalDate(measure.begin);
	if (start) keys.add(getMonthKey(start));
	return [...keys];
}

export async function submitReturnMeasureReport(
	measure: ReturnMeasureStudent,
	action: ReturnMeasureReportAction,
): Promise<boolean> {
	const payload: ReturnMeasureReportRequest = { type: REPORT_REQUEST_TYPE[action] };

	try {
		const result = await putJson(endpoints.returnMeasureReport(measure.id), payload);

		if (!result.ok) {
			toast.error('Fout bij het melden van de terugkommaatregel', { description: result.error });
			return false;
		}

		const monthKeys = monthKeysForMeasure(measure);
		invalidateReturnMeasureCache(monthKeys);
		await bulkListRegistry.refresh('return-measures', getTodayKey(), 'background');

		toast.success(REPORT_SUCCESS_MESSAGE[action]);
		return true;
	} catch (err) {
		toast.error('Fout bij het melden van de terugkommaatregel', {
			description: err instanceof Error ? err.message : 'Onbekende fout',
		});
		return false;
	}
}
