import type { ReturnMeasuresResponse } from '@/magister/response/return-measure.types';
import { getReturnMeasureTemplates } from '../../utils/helpers';
import { expandReturnMeasureTemplates } from '../../utils/returnMeasures';

export async function GET(req: Request, studentId: number): Promise<Response> {
	const url = new URL(req.url);
	const beginDateParam = url.searchParams.get('begin') ?? '';
	const endDateParam = url.searchParams.get('einde') ?? '';

	const templates = getReturnMeasureTemplates()[studentId] ?? [];
	const items = expandReturnMeasureTemplates(templates, beginDateParam, endDateParam);

	const response: ReturnMeasuresResponse = {
		items,
		links: {
			first: {
				href: `/api/leerlingen/${studentId}/verantwoordingen/terugkommaatregelen?begin=${beginDateParam}&einde=${endDateParam}`,
			},
			last: {
				href: `/api/leerlingen/${studentId}/verantwoordingen/terugkommaatregelen?begin=${beginDateParam}&einde=${endDateParam}`,
			},
		},
		totalCount: items.length,
	};

	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}
