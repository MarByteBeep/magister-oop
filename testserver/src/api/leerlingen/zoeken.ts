import { getAllStudents } from 'src/api/utils/helpers';
import type { Student } from '@/magister/types';
import { search } from '../utils/search';

export async function GET(req: Request) {
	return search<Student>(req, '/api/leerlingen/zoeken', getAllStudents());
}
