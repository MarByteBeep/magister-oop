import {
	parseCreateReturnMeasureRequest,
	studentExistsById,
	toReturnMeasureTemplate,
} from '../../utils/createReturnMeasure';
import { appendReturnMeasureTemplate } from '../../utils/helpers';
import { jsonError } from '../../utils/jsonResponses';

export async function POST(req: Request, studentId: number): Promise<Response> {
	if (!studentExistsById(studentId)) return jsonError('Student not found', 404);

	const parsed = await parseCreateReturnMeasureRequest(req);
	if (!parsed.ok) return parsed.response;

	appendReturnMeasureTemplate(studentId, toReturnMeasureTemplate(parsed.body, parsed.dayOffset, parsed.dayCount));
	console.log(`Created return measure for student ${studentId}`, parsed.body);

	return new Response(null, { status: 204 });
}
