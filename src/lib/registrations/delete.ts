import { toast } from 'sonner';
import { bulkListRegistry } from '@/lib/bulk-lists/sources';
import { applyRegistrationsToStudents } from '@/lib/registrations/apply';
import { invalidateRegistrationCache, refreshRegistrations } from '@/lib/registrations/fetch';
import { getTodayKey } from '@/lib/shared/dateUtils';
import { studentDataStore } from '@/lib/students/dataStore';
import { deleteJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';

function unknownErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	return 'Onbekende fout';
}

async function refreshRegistrationsAfterDelete(dateKey: string): Promise<void> {
	if (dateKey === getTodayKey()) {
		await bulkListRegistry.refresh('registrations', dateKey, 'background');
		return;
	}
	const data = await refreshRegistrations(dateKey);
	studentDataStore.setStudents((prev) => applyRegistrationsToStudents(prev, data, dateKey));
}

async function deleteRegistrationRequest(registrationId: number, dateKey: string): Promise<boolean> {
	const result = await deleteJson(endpoints.deleteRegistration(registrationId));
	if (!result.ok) {
		toast.error('Fout bij het verwijderen van de registratie', {
			description: result.error,
		});
		return false;
	}

	invalidateRegistrationCache([dateKey]);
	await refreshRegistrationsAfterDelete(dateKey);
	toast.success('Registratie verwijderd');
	return true;
}

export async function deleteRegistration(registrationId: number, dateKey: string): Promise<boolean> {
	try {
		return await deleteRegistrationRequest(registrationId, dateKey);
	} catch (err) {
		toast.error('Fout bij het verwijderen van de registratie', {
			description: unknownErrorMessage(err),
		});
		return false;
	}
}
