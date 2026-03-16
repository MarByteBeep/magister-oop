import type { LockersResponse } from '@/magister/response/locker.types';
import { getAllLockers } from '../../utils/helpers';

export async function GET(_req: Request) {
	const lockersResponse: LockersResponse = {
		lockersDetails: getAllLockers(),
		links: {},
	};

	return new Response(JSON.stringify(lockersResponse), {
		headers: { 'Content-Type': 'application/json' },
	});
}
