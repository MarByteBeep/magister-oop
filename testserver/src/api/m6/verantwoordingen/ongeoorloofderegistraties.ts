import { timeTable } from '@/lib/agendaUtils';
import { getTodayKey } from '@/lib/dateUtils';
import type { UnauthorizedAbsencesResponse } from '@/magister/response/unauthorized-absence.types';
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
		for (const afspraak of item.afspraken) {
			const lesuurBegin = afspraak.lesuurBegin;
			const lesuurEinde = afspraak.lesuurEinde;

			if (
				lesuurBegin >= 1 &&
				lesuurBegin <= timeTable.length &&
				lesuurEinde >= 1 &&
				lesuurEinde <= timeTable.length
			) {
				const beginSlot = timeTable[lesuurBegin - 1];
				const eindeSlot = timeTable[lesuurEinde - 1];

				afspraak.begin = cetToUtcISO(beginSlot.begin, todayKey);
				afspraak.einde = cetToUtcISO(eindeSlot.einde, todayKey);
			}
		}
	}

	// Update links to use today's date
	const response: UnauthorizedAbsencesResponse = {
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
