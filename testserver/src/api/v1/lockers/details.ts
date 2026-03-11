import { getAllLockers } from 'src/api/utils/helpers';
import type { LockersResponse } from '@/magister/response/locker.types';

export async function GET(_req: Request) {
	const lockersResponse: LockersResponse = {
		lockersDetails: getAllLockers(),
		links: {},
	};

	return new Response(JSON.stringify(lockersResponse), {
		headers: { 'Content-Type': 'application/json' },
	});
}
