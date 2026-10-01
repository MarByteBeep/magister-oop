import { toast } from 'sonner';
import { bulkListRegistry } from '@/lib/bulk-lists/sources';
import { applyRegistrationsToStudents } from '@/lib/registrations/apply';
import { invalidateRegistrationCache, refreshRegistrations } from '@/lib/registrations/fetch';
import { getTodayKey } from '@/lib/shared/dateUtils';
import { studentDataStore } from '@/lib/students/dataStore';
import { deleteJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';

export async function deleteRegistration(registrationId: number, dateKey: string): Promise<boolean> {
	try {
		const result = await deleteJson(endpoints.deleteRegistration(registrationId));

		if (!result.ok) {
			toast.error('Fout bij het verwijderen van de registratie', { description: result.error });
			return false;
		}

		invalidateRegistrationCache([dateKey]);
		if (dateKey === getTodayKey()) {
			await bulkListRegistry.refresh('registrations', dateKey, 'background');
		} else {
			const data = await refreshRegistrations(dateKey);
			studentDataStore.setStudents((prev) => applyRegistrationsToStudents(prev, data, dateKey));
		}

		toast.success('Registratie verwijderd');
		return true;
	} catch (err) {
		toast.error('Fout bij het verwijderen van de registratie', {
			description: err instanceof Error ? err.message : 'Onbekende fout',
		});
		return false;
	}
}
