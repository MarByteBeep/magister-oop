'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getOrCreateBlobUrl } from '@/lib/blobUtils';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { Address, AddressesResponse } from '@/magister/response/address.types';
import type { ContactItem, ContactsResponse } from '@/magister/response/contact.types';
import type { ParentsResponse } from '@/magister/response/parent.types';
import type { StudentDetails } from '@/magister/response/student-details.types';
import type { Student } from '@/magister/types';

export type ParentContact = {
	id: number;
	parentName: string;
	verzorgerType?: string | null;
	geslacht: string;
	contacts: ContactItem[];
};

function filterAndDeduplicateContacts(contacts: ContactItem[]): ContactItem[] {
	const uniqueContacts: ContactItem[] = [];
	const seenValues = new Set<string>();

	for (const contact of contacts) {
		let value: string | null = null;

		if (contact.type === 'telefoonnummer') {
			value = contact.telefoonnummer;
		} else if (contact.type === 'emailadres') {
			value = contact.emailadres;
		}

		if (value && !seenValues.has(value)) {
			seenValues.add(value);
			uniqueContacts.push(contact);
		}
	}

	return uniqueContacts;
}

export function useStudentDetailsData(student?: Student) {
	const [personalDetails, setPersonalDetails] = useState<StudentDetails | undefined>(undefined);
	const [address, setAddress] = useState<Address | undefined>(undefined);
	const [photoBlobUrl, setPhotoBlobUrl] = useState<string | undefined>(undefined);
	const [parentContacts, setParentContacts] = useState<ParentContact[]>([]);
	const [loadingPersonalDetails, setLoadingPersonalDetails] = useState(true);
	const [loadingAddress, setLoadingAddress] = useState(true);
	const [loadingParentContacts, setLoadingParentContacts] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const studentId = student?.id;
	const photoHref = student?.links.foto?.href;

	useEffect(() => {
		if (studentId === null || studentId === undefined || student === null) {
			setPersonalDetails(undefined);
			setPhotoBlobUrl(undefined);
			setLoadingPersonalDetails(false);
			setLoadingAddress(false);
			setAddress(undefined);
			setError(null);
			setParentContacts([]);
			setLoadingParentContacts(false);
			return;
		}

		let isCancelled = false;

		const fetchAllData = async () => {
			setPersonalDetails(undefined);
			setPhotoBlobUrl(undefined);
			setLoadingPersonalDetails(true);
			setLoadingAddress(true);
			setAddress(undefined);
			setError(null);
			setParentContacts([]);
			setLoadingParentContacts(true);

			try {
				if (photoHref) {
					const photoUrl = await getOrCreateBlobUrl(photoHref);
					if (!isCancelled) {
						setPhotoBlobUrl(photoUrl);
					}
				}

				{
					const data = await getJson<StudentDetails>(endpoints.studentPersonalDetails(studentId));
					if (isCancelled) return;
					setPersonalDetails(data);
					setLoadingPersonalDetails(false);
				}

				{
					const data = await getJson<AddressesResponse>(endpoints.studentAddress(studentId));
					if (isCancelled) return;
					setAddress(data.items.find((t) => t.type === 'woon'));
					setLoadingAddress(false);
				}

				const parentsResponse = await getJson<ParentsResponse>(endpoints.studentParents(studentId));
				if (isCancelled) return;

				const parentContactPromises = parentsResponse.items.map(async (parent) => {
					const parentName = `${parent.voorletters} ${parent.tussenvoegsel ? `${parent.tussenvoegsel} ` : ''}${parent.achternaam}`;
					try {
						const contactDetailsResponse = await getJson<ContactsResponse>(
							endpoints.parentContactDetails(parent.id),
						);
						const filteredContacts = filterAndDeduplicateContacts(contactDetailsResponse.items);

						return {
							id: parent.id,
							parentName,
							verzorgerType: parent.verzorgerType,
							geslacht: parent.geslacht,
							contacts: filteredContacts,
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

				const parentContactsData = await Promise.all(parentContactPromises);
				if (!isCancelled) {
					setParentContacts(parentContactsData);
					setLoadingParentContacts(false);
				}
			} catch (err) {
				if (isCancelled) return;
				console.error('Error fetching student details:', err);

				if (err instanceof Error && err.name === 'StorageQuotaExceededError') {
					toast.error('Opslaglimiet bereikt', {
						id: 'storage-quota-exceeded',
						description:
							'De sessieopslag is vol. Sluit browser en open de extensie opnieuw om ruimte vrij te maken.',
						duration: Infinity,
					});
				} else {
					setError('Fout bij het laden van leerlingdetails.');
				}
				setLoadingParentContacts(false);
			}
		};

		void fetchAllData();

		return () => {
			isCancelled = true;
		};
	}, [studentId, photoHref, student]);

	return {
		personalDetails,
		address,
		photoBlobUrl,
		parentContacts,
		loadingPersonalDetails,
		loadingAddress,
		loadingParentContacts,
		error,
	};
}
