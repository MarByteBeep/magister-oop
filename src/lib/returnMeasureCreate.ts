import { toast } from 'sonner';
import { bulkListRegistry } from '@/lib/bulkListSources';
import { buildCreateReturnMeasureRequest, type CreateReturnMeasureFormInput } from '@/lib/createReturnMeasureRequest';
import { invalidateReturnMeasureCache } from '@/lib/returnMeasureFetch';
import { returnMeasureSpanMonthKeys } from '@/lib/returnMeasureUtils';
import { postJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';

export async function submitReturnMeasure(studentId: number, input: CreateReturnMeasureFormInput): Promise<boolean> {
	const payload = buildCreateReturnMeasureRequest(input);
	if (!payload) {
		toast.error('Controleer de ingevulde gegevens');
		return false;
	}

	try {
		const result = await postJson(endpoints.createReturnMeasure(studentId), payload);

		if (!result.ok) {
			toast.error('Fout bij het aanmaken van de terugkommaatregel', { description: result.error });
			return false;
		}

		const monthKeys = returnMeasureSpanMonthKeys(input.dateKey, input.dayCount);
		invalidateReturnMeasureCache(monthKeys);
		await Promise.all(
			monthKeys.map((monthKey) => bulkListRegistry.refresh('return-measures', `${monthKey}-01`, 'background')),
		);

		toast.success('Terugkommaatregel succesvol aangemaakt');
		return true;
	} catch (err) {
		toast.error('Fout bij het aanmaken van de terugkommaatregel', {
			description: err instanceof Error ? err.message : 'Onbekende fout',
		});
		return false;
	}
}
