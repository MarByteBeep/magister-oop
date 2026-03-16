import type { StaffMember } from '@/magister/response/staffmember.types';
import { getAllStaffMembers } from '../utils/helpers';
import { search } from '../utils/search';

export async function GET(req: Request) {
	return search<StaffMember>(req, '/api/medewerkers/zoeken', getAllStaffMembers());
}
