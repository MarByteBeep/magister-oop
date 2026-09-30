import { toast } from 'sonner';
import { invalidateAbsenceNoticeCache } from '@/lib/absence-notice/fetch';
import { bulkListRegistry } from '@/lib/bulk-lists/sources';
import { deleteJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';

export async function deleteAbsenceNotice(
	studentUuid: string,
	absenceNoticeId: string,
	dateKeys: string[],
): Promise<boolean> {
	try {
		const result = await deleteJson(endpoints.deleteAbsenceNotice(studentUuid, absenceNoticeId), 'omit', 'bearer');

		if (!result.ok) {
			toast.error('Fout bij het verwijderen van de afwezigheid', { description: result.error });
			return false;
		}

		invalidateAbsenceNoticeCache(dateKeys);
		await Promise.all(
			dateKeys.map((dateKey) => bulkListRegistry.refresh('absence-notices', dateKey, 'background')),
		);

		toast.success('Afwezigheid verwijderd');
		return true;
	} catch (err) {
		toast.error('Fout bij het verwijderen van de afwezigheid', {
			description: err instanceof Error ? err.message : 'Onbekende fout',
		});
		return false;
	}
}
