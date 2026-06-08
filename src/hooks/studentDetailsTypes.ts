import type { Address } from '@/magister/response/address.types';
import type { ContactItem } from '@/magister/response/contact.types';
import type { StudentDetails } from '@/magister/response/student-details.types';

export type ParentContact = {
	id: number;
	parentName: string;
	verzorgerType?: string | null;
	geslacht: string;
	contacts: ContactItem[];
};

export type StudentDetailsData = {
	photoBlobUrl?: string;
	personalDetails: StudentDetails;
	address?: Address;
	parentContacts: ParentContact[];
};
