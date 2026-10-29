import { toast } from 'sonner';
import { invalidateAbsenceNoticeCache } from '@/lib/absence-notice/fetch';
import { bulkListRegistry } from '@/lib/bulk-lists/sources';
import { deleteJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';

function unknownErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	return 'Onbekende fout';
}

async function deleteAbsenceNoticeRequest(
	studentUuid: string,
	absenceNoticeId: string,
	dateKeys: string[],
): Promise<boolean> {
	const result = await deleteJson(endpoints.deleteAbsenceNotice(studentUuid, absenceNoticeId), 'omit', 'bearer');
	if (!result.ok) {
		toast.error('Fout bij het verwijderen van de afwezigheid', {
			description: result.error,
		});
		return false;
	}

	invalidateAbsenceNoticeCache(dateKeys);
	await Promise.all(dateKeys.map((dateKey) => bulkListRegistry.refresh('absence-notices', dateKey, 'background')));
	toast.success('Afwezigheid verwijderd');
	return true;
}

export async function deleteAbsenceNotice(
	studentUuid: string,
	absenceNoticeId: string,
	dateKeys: string[],
): Promise<boolean> {
	try {
		return await deleteAbsenceNoticeRequest(studentUuid, absenceNoticeId, dateKeys);
	} catch (err) {
		toast.error('Fout bij het verwijderen van de afwezigheid', {
			description: unknownErrorMessage(err),
		});
		return false;
	}
}
