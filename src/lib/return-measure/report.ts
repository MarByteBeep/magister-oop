import { toast } from 'sonner';
import { bulkListRegistry } from '@/lib/bulk-lists/sources';
import { invalidateReturnMeasureCache } from '@/lib/return-measure/fetch';
import { measureWithReportStatus, returnMeasureReportStatus } from '@/lib/return-measure/overview';
import { getDateKey, getMonthKey, getTodayKey, parseDateKey, parseOptionalDate } from '@/lib/shared/dateUtils';
import { formatPersonName } from '@/lib/shared/stringUtils';
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

function reportSuccessMessage(measure: ReturnMeasureStudent, action: ReturnMeasureReportAction): string {
	const student = measure.leerling;
	const name = formatPersonName(student.roepnaam, student.tussenvoegsel, student.achternaam);
	return action === 'reported' ? `${name} heeft zich gemeld` : `${name} heeft zich niet gemeld`;
}

const reportOverlays = new Map<number, ReturnMeasureReportAction>();
const reportOverlayListeners = new Set<() => void>();

export function snapshotReturnMeasureReportOverlays(): Map<number, ReturnMeasureReportAction> {
	return new Map(reportOverlays);
}

/** Apply a successful report onto a stale fetch payload. No-op once the server flags are present. */
export function applyReturnMeasureReportOverlay(
	measure: ReturnMeasureStudent,
	overlays: ReadonlyMap<number, ReturnMeasureReportAction> = reportOverlays,
): ReturnMeasureStudent {
	const action = overlays.get(measure.id);
	if (!action || returnMeasureReportStatus(measure) !== 'none') return measure;
	return measureWithReportStatus(measure, action);
}

export function subscribeReturnMeasureReportOverlays(listener: () => void): () => void {
	reportOverlayListeners.add(listener);
	return () => {
		reportOverlayListeners.delete(listener);
	};
}

function rememberReturnMeasureReport(measureId: number, action: ReturnMeasureReportAction) {
	reportOverlays.set(measureId, action);
	for (const listener of reportOverlayListeners) listener();
}

/** Open measures are planned; fall back to today if `begin` is missing. */
function reportDateKey(measure: ReturnMeasureStudent): string {
	const start = parseOptionalDate(measure.begin);
	return start ? getDateKey(start) : getTodayKey();
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

		rememberReturnMeasureReport(measure.id, action);
		const dateKey = reportDateKey(measure);
		invalidateReturnMeasureCache([getMonthKey(parseDateKey(dateKey))]);
		await bulkListRegistry.refresh('return-measures', dateKey, 'background');

		toast.success(reportSuccessMessage(measure, action));
		return true;
	} catch (err) {
		toast.error('Fout bij het melden van de terugkommaatregel', {
			description: err instanceof Error ? err.message : 'Onbekende fout',
		});
		return false;
	}
}
