import type { ReturnMeasureStudentsResponse } from '@/magister/response/returnMeasure.types';
import { jsonOk } from '../../utils/jsonResponses';
import { beginEndParams, collectReturnMeasures } from '../../utils/returnMeasureCollect';

export async function GET(req: Request): Promise<Response> {
	const { beginParam, endParam } = beginEndParams(req);
	const items = collectReturnMeasures(beginParam, endParam);

	const href = `/api/m6/leerlingen/terugkomers?begin=${beginParam}&einde=${endParam}&Status=Alles`;
	const response: ReturnMeasureStudentsResponse = {
		items,
		links: {
			first: { href },
			last: { href },
		},
		totalCount: items.length,
	};

	return jsonOk(response);
}
