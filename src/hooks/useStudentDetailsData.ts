'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Address } from '@/magister/response/address.types';
import type { StudentDetails } from '@/magister/response/student-details.types';
import type { Student } from '@/magister/types';
import { loadAllStudentDetails } from './studentDetailsFetchers';
import type { ParentContact } from './studentDetailsTypes';

export type { ParentContact } from './studentDetailsTypes';

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
		if (studentId == null || student == null) {
			setPersonalDetails(undefined);
			setPhotoBlobUrl(undefined);
			setAddress(undefined);
			setParentContacts([]);
			setError(null);
			setLoadingPersonalDetails(false);
			setLoadingAddress(false);
			setLoadingParentContacts(false);
			return;
		}

		let isCancelled = false;
		setLoadingPersonalDetails(true);
		setLoadingAddress(true);
		setLoadingParentContacts(true);
		setError(null);

		void loadAllStudentDetails(studentId, photoHref)
			.then((data) => {
				if (isCancelled) return;
				setPhotoBlobUrl(data.photoBlobUrl);
				setPersonalDetails(data.personalDetails);
				setAddress(data.address);
				setParentContacts(data.parentContacts);
				setLoadingPersonalDetails(false);
				setLoadingAddress(false);
				setLoadingParentContacts(false);
			})
			.catch((err) => {
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
				setLoadingPersonalDetails(false);
				setLoadingAddress(false);
				setLoadingParentContacts(false);
			});

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
