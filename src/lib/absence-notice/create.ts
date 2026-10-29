import { toast } from 'sonner';
import { buildCreateAbsenceNoticeRequest, type CreateAbsenceNoticeFormInput } from '@/lib/absence-notice/createRequest';
import { invalidateAbsenceNoticeCache } from '@/lib/absence-notice/fetch';
import { bulkListRegistry } from '@/lib/bulk-lists/sources';
import { postJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { CreateAbsenceNoticeResponse } from '@/magister/response/attendanceType.types';

function errorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	return 'Onbekende fout';
}

function validationDescription(response: CreateAbsenceNoticeResponse): string {
	const messages = response.validationMessages;
	if (!messages) return 'Validatie mislukt';
	return messages.join(', ');
}

function isInvalidAbsenceResponse(
	response: CreateAbsenceNoticeResponse | undefined,
): response is CreateAbsenceNoticeResponse {
	if (!response) return false;
	return response.isValid === false;
}

async function completeAbsenceNoticePost(
	input: CreateAbsenceNoticeFormInput,
	payload: NonNullable<ReturnType<typeof buildCreateAbsenceNoticeRequest>>,
): Promise<boolean> {
	const result = await postJson(endpoints.createAbsenceNotice(input.studentUuid), payload, 'omit', 'bearer');
	if (!result.ok) {
		toast.error('Fout bij het aanmaken van de afwezigheid', {
			description: result.error,
		});
		return false;
	}

	const response = result.data as CreateAbsenceNoticeResponse | undefined;
	if (isInvalidAbsenceResponse(response)) {
		toast.error('Fout bij het aanmaken van de afwezigheid', {
			description: validationDescription(response),
		});
		return false;
	}

	invalidateAbsenceNoticeCache([input.dateKey]);
	await bulkListRegistry.refresh('absence-notices', input.dateKey, 'background');
	toast.success('Afwezigheid succesvol aangemaakt');
	return true;
}

async function postAbsenceNotice(
	input: CreateAbsenceNoticeFormInput,
	payload: NonNullable<ReturnType<typeof buildCreateAbsenceNoticeRequest>>,
): Promise<boolean> {
	try {
		return await completeAbsenceNoticePost(input, payload);
	} catch (err) {
		toast.error('Fout bij het aanmaken van de afwezigheid', {
			description: errorMessage(err),
		});
		return false;
	}
}

export async function submitAbsenceNotice(input: CreateAbsenceNoticeFormInput): Promise<boolean> {
	const payload = buildCreateAbsenceNoticeRequest(input);
	if (!payload) {
		toast.error('Controleer de ingevulde gegevens');
		return false;
	}
	return postAbsenceNotice(input, payload);
}
