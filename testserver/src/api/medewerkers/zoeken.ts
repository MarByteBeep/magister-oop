import { getAllStaffMembers } from 'src/api/utils/helpers';
import type { StaffMember } from '@/magister/response/staffmember.types';
import { search } from '../utils/search';

export async function GET(req: Request) {
	return search<StaffMember>(req, '/api/medewerkers/zoeken', getAllStaffMembers());
}
