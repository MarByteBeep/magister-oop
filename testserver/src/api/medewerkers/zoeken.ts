import type { StaffMember } from '@/magister/response/staffMember.types';
import { getAllStaffMembers } from '../utils/helpers';
import { search } from '../utils/search';

export async function GET(req: Request) {
	return search<StaffMember>(req, '/api/medewerkers/zoeken', getAllStaffMembers());
}
