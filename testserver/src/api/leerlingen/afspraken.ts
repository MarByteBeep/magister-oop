import { getAllAgendaItems } from 'src/api/utils/helpers';
import { getTodayKey } from '@/lib/dateUtils';
import type { AgendaResponse } from '@/magister/response/agenda.types';

export async function GET(req: Request, studentId: number): Promise<Response> {
	const url = new URL(req.url);
	const searchParams = url.searchParams;
	const beginDateParam = searchParams.get('begin');
	const endDateParam = searchParams.get('einde');

	const allStudentsAgenda = getAllAgendaItems();
	const studentAgenda = [...(allStudentsAgenda[studentId] || [])];

	// Use the requested date instead of always using today
	const date = beginDateParam ?? getTodayKey();

	studentAgenda.forEach((e) => {
		e.begin = e.begin.replace('{date}', date);
		e.einde = e.einde.replace('{date}', date);
	});

	const response: AgendaResponse = {
		items: studentAgenda,
		links: {
			first: {
				href: `/api/leerlingen/${studentId}/afspraken?begin=${beginDateParam}&einde=${endDateParam}&status=actief`,
			},
			last: {
				href: `/api/leerlingen/${studentId}/afspraken?begin=${beginDateParam}&einde=${endDateParam}&status=actief`,
			},
		},
		totalCount: studentAgenda.length,
	};

	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}
