import type { Student } from '@/magister/types';
import { getAllStudents } from '../utils/helpers';
import { search } from '../utils/search';

export async function GET(req: Request) {
	return search<Student>(req, '/api/leerlingen/zoeken', getAllStudents());
}
