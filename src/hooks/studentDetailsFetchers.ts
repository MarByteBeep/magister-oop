import { getOrCreateBlobUrl } from '@/lib/blobUtils';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { AddressesResponse } from '@/magister/response/address.types';
import type { ContactItem, ContactsResponse } from '@/magister/response/contact.types';
import type { ParentsResponse } from '@/magister/response/parent.types';
import type { StudentDetails } from '@/magister/response/student-details.types';
import type { ParentContact, StudentDetailsData } from './studentDetailsTypes';

function filterAndDeduplicateContacts(contacts: ContactItem[]): ContactItem[] {
	const uniqueContacts: ContactItem[] = [];
	const seenValues = new Set<string>();

	for (const contact of contacts) {
		const value =
			contact.type === 'telefoonnummer'
				? contact.telefoonnummer
				: contact.type === 'emailadres'
					? contact.emailadres
					: null;

		if (value && !seenValues.has(value)) {
			seenValues.add(value);
			uniqueContacts.push(contact);
		}
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

export async function fetchParentContacts(studentId: number): Promise<ParentContact[]> {
	const parentsResponse = await getJson<ParentsResponse>(endpoints.studentParents(studentId));

	const parentContactPromises = parentsResponse.items.map(async (parent) => {
		const parentName = `${parent.voorletters} ${parent.tussenvoegsel ? `${parent.tussenvoegsel} ` : ''}${parent.achternaam}`;
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
	});

	return Promise.all(parentContactPromises);
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
