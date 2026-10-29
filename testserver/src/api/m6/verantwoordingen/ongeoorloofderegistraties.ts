import { getTodayKey } from '@/lib/shared/dateUtils';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';
import { getAllStudents } from '../../utils/helpers';
import { jsonOk } from '../../utils/jsonResponses';
import {
	buildRegistrationsResponse,
	refreshRegistrationItem,
	removeRegistrationFromItem,
} from '../../utils/registrationRefresh';
import registrationsData from './ongeoorloofderegistraties.json' with { type: 'json' };

const data = registrationsData as RegistrationsResponse;

export function removeRegistration(registrationId: number): boolean {
	let removed = false;
	for (const item of data.items) {
		if (removeRegistrationFromItem(item, registrationId)) removed = true;
	}
	return removed;
}

export async function GET(_req: Request): Promise<Response> {
	const students = getAllStudents();
	const todayKey = getTodayKey();

	for (const item of data.items) {
		refreshRegistrationItem(item, students, todayKey);
	}

	return jsonOk(buildRegistrationsResponse(data, todayKey));
}
