import { toast } from 'sonner';
import { postJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { CreateAccountabilityRequest } from '@/magister/response/accountability.types';
import type { AgendaItem } from '@/magister/response/agenda.types';

function unknownErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	return 'Onbekende fout';
}

async function submitTardyAccountabilityRequest(studentId: number, item: AgendaItem): Promise<boolean> {
	const payload: CreateAccountabilityRequest = {
		persoonId: studentId,
		redenId: 4,
		opmerking: '',
	};
	const result = await postJson(endpoints.createAccountability(item.id), payload);
	if (!result.ok) {
		toast.error('Fout bij het aanmaken van de te laat melding', {
			description: result.error,
		});
		return false;
	}
	toast.success('Te laat melding succesvol aangemaakt');
	return true;
}

export async function submitTardyAccountability(studentId: number, item: AgendaItem): Promise<boolean> {
	try {
		return await submitTardyAccountabilityRequest(studentId, item);
	} catch (err) {
		toast.error('Fout bij het aanmaken van de te laat melding', {
			description: unknownErrorMessage(err),
		});
		return false;
	}
}
