import { timeTable } from '@/lib/agendaUtils';
import { getTodayKey } from '@/lib/dateUtils';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';
import { getAllStudents } from '../../utils/helpers';
import { pickRandom } from '../../utils/random';
import data from './ongeoorloofderegistraties.json' with { type: 'json' };

// Convert CET time to UTC ISO string for a given date
function cetToUtcISO(cetTime: string, date: string): string {
	// CET is UTC+1 in winter
	const cetDate = new Date(`${date}T${cetTime}:00+01:00`);
	return cetDate.toISOString();
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

				appointment.begin = cetToUtcISO(startSlot.start, todayKey);
				appointment.einde = cetToUtcISO(endSlot.end, todayKey);
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
