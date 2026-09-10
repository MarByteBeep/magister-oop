import type { ReturnMeasureStudent, ReturnMeasureStudentsResponse } from '@/magister/response/return-measure.types';
import { getAllStaffMembers, getAllStudents, getReturnMeasureTemplates } from '../../utils/helpers';
import { expandReturnMeasureTemplates } from '../../utils/returnMeasures';

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const beginParam = url.searchParams.get('begin') ?? '';
	const endParam = url.searchParams.get('einde') ?? '';

	const templatesByStudent = getReturnMeasureTemplates();
	const staffById = new Map(getAllStaffMembers().map((staffMember) => [staffMember.id, staffMember]));
	const items: ReturnMeasureStudent[] = [];

	for (const student of getAllStudents()) {
		const templates = templatesByStudent[student.id] ?? [];
		if (templates.length === 0) continue;
		items.push(...expandReturnMeasureTemplates(templates, student, staffById, beginParam, endParam));
	}

	const href = `/api/m6/leerlingen/terugkomers?begin=${beginParam}&einde=${endParam}&Status=Alles`;
	const response: ReturnMeasureStudentsResponse = {
		items,
		links: {
			first: { href },
			last: { href },
		},
		totalCount: items.length,
	};

	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}
