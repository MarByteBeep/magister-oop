import { getTodayKey } from '@/lib/dateUtils';
import type { AgendaItem, AgendaResponse } from '@/magister/response/agenda.types';
import { getAllAgendaItems } from '../utils/helpers';

function applyAgendaDate(isoTemplate: string, date: string): string {
	if (isoTemplate.includes('{date}')) {
		return isoTemplate.replace('{date}', date);
	}
	return isoTemplate.replace(/^\d{4}-\d{2}-\d{2}/, date);
}

function cloneAgendaForDate(templates: AgendaItem[], date: string): AgendaItem[] {
	return templates.map((item) => ({
		...item,
		begin: applyAgendaDate(item.begin, date),
		einde: applyAgendaDate(item.einde, date),
	}));
}

export async function GET(req: Request, studentId: number): Promise<Response> {
	const url = new URL(req.url);
	const searchParams = url.searchParams;
	const beginDateParam = searchParams.get('begin');
	const endDateParam = searchParams.get('einde');

	const templates = getAllAgendaItems()[studentId] || [];
	const date = beginDateParam || getTodayKey();
	const studentAgenda = cloneAgendaForDate(templates, date);

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
