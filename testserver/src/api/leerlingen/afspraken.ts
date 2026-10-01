import { eachDateKey, getTodayKey, parseDateKey } from '@/lib/shared/dateUtils';
import type { AgendaItem, AgendaResponse, Participant } from '@/magister/response/agenda.types';
import { getAllAgendaItems } from '../utils/helpers';

function applyAgendaDate(isoTemplate: string, date: string): string {
	if (isoTemplate.includes('{date}')) {
		return isoTemplate.replace('{date}', date);
	}
	return isoTemplate.replace(/^\d{4}-\d{2}-\d{2}/, date);
}

function occurrenceId(templateId: number, date: string): number {
	return templateId * 100_000_000 + Number(date.replaceAll('-', ''));
}

function cloneAgendaForDate(templates: AgendaItem<Participant>[], date: string): AgendaItem<Participant>[] {
	return templates.map((item) => {
		const id = occurrenceId(item.id, date);
		return {
			...item,
			id,
			begin: applyAgendaDate(item.begin, date),
			einde: applyAgendaDate(item.einde, date),
			links: {
				...item.links,
				self: { href: `/api/afspraken/${id}` },
			},
		};
	});
}

function dateKeyFromParam(value: string | null): string | null {
	if (!value) return null;
	const dateKey = value.slice(0, 10);
	return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : null;
}

function isSchoolDay(dateKey: string): boolean {
	const weekday = parseDateKey(dateKey).getDay();
	return weekday !== 0 && weekday !== 6;
}

function expandWeek(week: AgendaItem<Participant>[][], begin: string, end: string): AgendaItem<Participant>[] {
	const items: AgendaItem<Participant>[] = [];
	for (const dateKey of eachDateKey(parseDateKey(begin), parseDateKey(end))) {
		if (!isSchoolDay(dateKey)) continue;
		const dayTemplates = week[parseDateKey(dateKey).getDay() - 1] ?? [];
		items.push(...cloneAgendaForDate(dayTemplates, dateKey));
	}
	return items;
}

export async function GET(req: Request, studentId: number): Promise<Response> {
	const url = new URL(req.url);
	const begin = dateKeyFromParam(url.searchParams.get('begin')) ?? getTodayKey();
	const end = dateKeyFromParam(url.searchParams.get('einde')) ?? begin;
	const week = getAllAgendaItems()[studentId] ?? [];
	const studentAgenda = expandWeek(week, begin, end);
	const href = `/api/leerlingen/${studentId}/afspraken?begin=${begin}&einde=${end}&status=actief`;

	const response: AgendaResponse = {
		items: studentAgenda,
		links: {
			first: { href },
			last: { href },
		},
		totalCount: studentAgenda.length,
	};

	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}
