import { timeTable } from '@/lib/agenda/utils';
import { registrationDeleteId } from '@/lib/registrations/entries';
import { getTodayKey } from '@/lib/shared/dateUtils';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';
import { getAllStudents } from '../../utils/helpers';
import { pickRandom } from '../../utils/random';
import registrationsData from './ongeoorloofderegistraties.json' with { type: 'json' };

const data = registrationsData as RegistrationsResponse;

/** Local lesson-clock time on `date`, same conversion as generated agenda lessons. */
function lessonTimeToIso(time: string, date: string): string {
	const [hours, minutes] = time.split(':').map(Number);
	const local = new Date(`${date}T00:00:00`);
	local.setHours(hours, minutes, 0, 0);
	return local.toISOString();
}

export function removeRegistration(registrationId: number): boolean {
	let removed = false;
	for (const item of data.items) {
		for (const appointment of item.afspraken) {
			const before = appointment.verantwoordingen.length;
			appointment.verantwoordingen = appointment.verantwoordingen.filter(
				(justification) => registrationDeleteId(justification) !== registrationId,
			);
			if (appointment.verantwoordingen.length !== before) removed = true;
		}
	}
	return removed;
}

export async function GET(_req: Request): Promise<Response> {
	const students = getAllStudents();
	const todayKey = getTodayKey();

	for (const item of data.items) {
		const student = pickRandom(students);

		item.id = student.id;
		item.achternaam = student.achternaam;
		item.roepnaam = student.roepnaam;
		item.voorletters = student.voorletters;

		// Update appointment times to use today's date
		for (const appointment of item.afspraken) {
			const lessonHourStart = appointment.lesuurBegin;
			const lessonHourEnd = appointment.lesuurEinde;

			if (
				lessonHourStart >= 1 &&
				lessonHourStart <= timeTable.length &&
				lessonHourEnd >= 1 &&
				lessonHourEnd <= timeTable.length
			) {
				const startSlot = timeTable[lessonHourStart - 1];
				const endSlot = timeTable[lessonHourEnd - 1];

				appointment.begin = lessonTimeToIso(startSlot.start, todayKey);
				appointment.einde = lessonTimeToIso(endSlot.end, todayKey);
			}
		}
	}

	// Update links to use today's date
	const response: RegistrationsResponse = {
		...data,
		links: {
			first: { href: `/api/m6/verantwoordingen/ongeoorloofderegistraties?datum=${todayKey}` },
			last: { href: `/api/m6/verantwoordingen/ongeoorloofderegistraties?datum=${todayKey}` },
		},
	};

	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}
