import { toast } from 'sonner';
import { buildCreateAbsenceNoticeRequest, type CreateAbsenceNoticeFormInput } from '@/lib/absence-notice/createRequest';
import { invalidateAbsenceNoticeCache } from '@/lib/absence-notice/fetch';
import { bulkListRegistry } from '@/lib/bulk-lists/sources';
import { postJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { CreateAbsenceNoticeResponse } from '@/magister/response/attendanceType.types';

export async function submitAbsenceNotice(input: CreateAbsenceNoticeFormInput): Promise<boolean> {
	const payload = buildCreateAbsenceNoticeRequest(input);
	if (!payload) {
		toast.error('Controleer de ingevulde gegevens');
		return false;
	}

	try {
		const result = await postJson(endpoints.createAbsenceNotice(input.studentUuid), payload, 'omit', 'bearer');

		if (!result.ok) {
			toast.error('Fout bij het aanmaken van de afwezigheid', { description: result.error });
			return false;
		}

		const response = result.data as CreateAbsenceNoticeResponse | undefined;
		if (response && response.isValid === false) {
			toast.error('Fout bij het aanmaken van de afwezigheid', {
				description: response.validationMessages?.join(', ') ?? 'Validatie mislukt',
			});
			return false;
		}

		invalidateAbsenceNoticeCache([input.dateKey]);
		await bulkListRegistry.refresh('absence-notices', input.dateKey, 'background');

		toast.success('Afwezigheid succesvol aangemaakt');
		return true;
	} catch (err) {
		toast.error('Fout bij het aanmaken van de afwezigheid', {
			description: err instanceof Error ? err.message : 'Onbekende fout',
		});
		return false;
	}
}
