import type { ParentContact, StudentDetailsData } from '@/hooks/students/studentDetails.types';
import { getOrCreateBlobUrl } from '@/lib/shared/blobUtils';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { AddressesResponse } from '@/magister/response/address.types';
import type { ContactItem, ContactsResponse } from '@/magister/response/contact.types';
import type { ParentsResponse } from '@/magister/response/parent.types';
import type { StudentDetails } from '@/magister/response/studentDetails.types';

function contactValue(contact: ContactItem): string | null {
	if (contact.type === 'telefoonnummer') return contact.telefoonnummer;
	if (contact.type === 'emailadres') return contact.emailadres;
	return null;
}

function shouldKeepContact(value: string | null, seenValues: Set<string>): value is string {
	if (!value) return false;
	return !seenValues.has(value);
}

function filterAndDeduplicateContacts(contacts: ContactItem[]): ContactItem[] {
	const uniqueContacts: ContactItem[] = [];
	const seenValues = new Set<string>();

	for (const contact of contacts) {
		const value = contactValue(contact);
		if (!shouldKeepContact(value, seenValues)) continue;
		seenValues.add(value);
		uniqueContacts.push(contact);
	}
	return uniqueContacts;
}

export async function fetchStudentPhoto(photoHref: string | undefined): Promise<string | undefined> {
	if (!photoHref) return undefined;
	return getOrCreateBlobUrl(photoHref);
}

export async function fetchStudentPersonalDetails(studentId: number): Promise<StudentDetails> {
	return getJson<StudentDetails>(endpoints.studentPersonalDetails(studentId));
}

export async function fetchStudentAddress(studentId: number) {
	const data = await getJson<AddressesResponse>(endpoints.studentAddress(studentId));
	return data.items.find((t) => t.type === 'woon');
}

function parentDisplayName(parent: ParentsResponse['items'][number]): string {
	if (parent.tussenvoegsel) {
		return `${parent.voorletters} ${parent.tussenvoegsel} ${parent.achternaam}`;
	}
	return `${parent.voorletters} ${parent.achternaam}`;
}

async function fetchOneParentContact(parent: ParentsResponse['items'][number]): Promise<ParentContact> {
	const parentName = parentDisplayName(parent);
	try {
		const contactDetailsResponse = await getJson<ContactsResponse>(endpoints.parentContactDetails(parent.id));
		return {
			id: parent.id,
			parentName,
			verzorgerType: parent.verzorgerType,
			geslacht: parent.geslacht,
			contacts: filterAndDeduplicateContacts(contactDetailsResponse.items),
		};
	} catch (err) {
		console.error(`Error fetching contact details for parent ${parent.id}:`, err);
		return {
			id: parent.id,
			parentName,
			verzorgerType: parent.verzorgerType,
			geslacht: parent.geslacht,
			contacts: [],
		};
	}
}

export async function fetchParentContacts(studentId: number): Promise<ParentContact[]> {
	const parentsResponse = await getJson<ParentsResponse>(endpoints.studentParents(studentId));
	return Promise.all(parentsResponse.items.map(fetchOneParentContact));
}

export async function loadAllStudentDetails(
	studentId: number,
	photoHref: string | undefined,
): Promise<StudentDetailsData> {
	const [photoBlobUrl, personalDetails, address, parentContacts] = await Promise.all([
		fetchStudentPhoto(photoHref),
		fetchStudentPersonalDetails(studentId),
		fetchStudentAddress(studentId),
		fetchParentContacts(studentId),
	]);

	return { photoBlobUrl, personalDetails, address, parentContacts };
}
