import type { StudentBase } from '@/magister/response/student.types';
import { getAllStudents } from '../utils/helpers';
import { search } from '../utils/search';

export async function GET(req: Request) {
	return search<StudentBase>(req, '/api/leerlingen/zoeken', getAllStudents());
}
