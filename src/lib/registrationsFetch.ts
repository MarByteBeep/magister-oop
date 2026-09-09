import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';

export function refreshRegistrations(dateKey: string): Promise<RegistrationsResponse> {
	return getJson<RegistrationsResponse>(endpoints.registrations(dateKey), 'include', 'no-cache');
}
