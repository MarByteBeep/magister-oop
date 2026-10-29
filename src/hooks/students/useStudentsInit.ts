import { useEffect } from 'react';
import type { MagisterSessionStatus } from '@/lib/session/magisterSession';
import { loadStudentDataFromSession } from '@/lib/students/dataStorePersistence';

function errorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	return String(err);
}

async function fetchWhileActive(
	cancelled: () => boolean,
	fetchStudentsPaginated: () => Promise<void>,
	fetchLockers: () => Promise<void>,
	setError: (error: string | null) => void,
	setLoading: (loading: boolean) => void,
) {
	setError(null);
	await fetchStudentsPaginated().catch((err) => setError(errorMessage(err)));
	if (cancelled()) return;
	await fetchLockers().catch((err) => setError(errorMessage(err)));
	if (cancelled()) return;
	setLoading(false);
}

async function initStudents(
	session: MagisterSessionStatus,
	cancelled: () => boolean,
	fetchStudentsPaginated: () => Promise<void>,
	fetchLockers: () => Promise<void>,
	setLoading: (loading: boolean) => void,
	setError: (error: string | null) => void,
) {
	setLoading(true);
	await loadStudentDataFromSession();
	if (session !== 'ready') return;
	await fetchWhileActive(cancelled, fetchStudentsPaginated, fetchLockers, setError, setLoading);
}

export function useStudentsInit(
	session: MagisterSessionStatus,
	fetchStudentsPaginated: () => Promise<void>,
	fetchLockers: () => Promise<void>,
	setLoading: (loading: boolean) => void,
	setError: (error: string | null) => void,
) {
	useEffect(() => {
		let cancelled = false;
		void initStudents(session, () => cancelled, fetchStudentsPaginated, fetchLockers, setLoading, setError);
		return () => {
			cancelled = true;
		};
	}, [session, fetchStudentsPaginated, fetchLockers, setLoading, setError]);
}
