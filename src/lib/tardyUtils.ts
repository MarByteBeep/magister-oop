import { toast } from 'sonner';
import { postJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { CreateAccountabilityRequest } from '@/magister/response/accountability.types';
import type { AgendaItem } from '@/magister/response/agenda.types';

export async function submitTardyAccountability(studentId: number, item: AgendaItem): Promise<boolean> {
	try {
		const payload: CreateAccountabilityRequest = {
			persoonId: studentId,
			redenId: 4,
			opmerking: '',
		};

		const result = await postJson(endpoints.createAccountability(item.id), payload);

		if (!result.ok) {
			toast.error('Fout bij het aanmaken van de te laat melding', { description: result.error });
			return false;
		}

		toast.success('Te laat melding succesvol aangemaakt');
		return true;
	} catch (err) {
		toast.error('Fout bij het aanmaken van de te laat melding', {
			description: err instanceof Error ? err.message : 'Onbekende fout',
		});
		return false;
	}
}
