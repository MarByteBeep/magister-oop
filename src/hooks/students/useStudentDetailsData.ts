'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ParentContact } from '@/hooks/students/studentDetails.types';
import { loadAllStudentDetails } from '@/hooks/students/studentDetailsFetchers';
import type { Address } from '@/magister/response/address.types';
import type { StudentDetails } from '@/magister/response/studentDetails.types';
import type { Student } from '@/types/student.types';

export type { ParentContact } from '@/hooks/students/studentDetails.types';

type StudentDetailsSetters = {
	setPhotoBlobUrl: (value: string | undefined) => void;
	setPersonalDetails: (value: StudentDetails | undefined) => void;
	setAddress: (value: Address | undefined) => void;
	setParentContacts: (value: ParentContact[]) => void;
	setLoadingPersonalDetails: (value: boolean) => void;
	setLoadingAddress: (value: boolean) => void;
	setLoadingParentContacts: (value: boolean) => void;
};

function applyLoadedStudentDetails(
	data: Awaited<ReturnType<typeof loadAllStudentDetails>>,
	setters: StudentDetailsSetters,
) {
	setters.setPhotoBlobUrl(data.photoBlobUrl);
	setters.setPersonalDetails(data.personalDetails);
	setters.setAddress(data.address);
	setters.setParentContacts(data.parentContacts);
	setters.setLoadingPersonalDetails(false);
	setters.setLoadingAddress(false);
	setters.setLoadingParentContacts(false);
}

function isStorageQuotaExceededError(err: unknown): boolean {
	if (!(err instanceof Error)) return false;
	return err.name === 'StorageQuotaExceededError';
}

function handleStudentDetailsLoadError(err: unknown, setError: (error: string | null) => void) {
	console.error('Error fetching student details:', err);
	if (isStorageQuotaExceededError(err)) {
		toast.error('Opslaglimiet bereikt', {
			id: 'storage-quota-exceeded',
			description: 'De sessieopslag is vol. Sluit browser en open de extensie opnieuw om ruimte vrij te maken.',
			duration: Infinity,
		});
		return;
	}
	setError('Fout bij het laden van leerlingdetails.');
}

function clearStudentDetailsState(setters: StudentDetailsSetters & { setError: (error: string | null) => void }) {
	setters.setPersonalDetails(undefined);
	setters.setPhotoBlobUrl(undefined);
	setters.setAddress(undefined);
	setters.setParentContacts([]);
	setters.setError(null);
	setters.setLoadingPersonalDetails(false);
	setters.setLoadingAddress(false);
	setters.setLoadingParentContacts(false);
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
		if (studentId === undefined) {
			clearStudentDetailsState({
				setPhotoBlobUrl,
				setPersonalDetails,
				setAddress,
				setParentContacts,
				setLoadingPersonalDetails,
				setLoadingAddress,
				setLoadingParentContacts,
				setError,
			});
			return;
		}
		if (!student) {
			clearStudentDetailsState({
				setPhotoBlobUrl,
				setPersonalDetails,
				setAddress,
				setParentContacts,
				setLoadingPersonalDetails,
				setLoadingAddress,
				setLoadingParentContacts,
				setError,
			});
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
				applyLoadedStudentDetails(data, {
					setPhotoBlobUrl,
					setPersonalDetails,
					setAddress,
					setParentContacts,
					setLoadingPersonalDetails,
					setLoadingAddress,
					setLoadingParentContacts,
				});
			})
			.catch((err) => {
				if (isCancelled) return;
				handleStudentDetailsLoadError(err, setError);
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
