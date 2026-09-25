import { useEffect } from 'react';
import type { MagisterSessionStatus } from '@/lib/magisterSession';
import { loadStudentDataFromSession } from '@/lib/studentDataStorePersistence';

const LOGIN_CANCELLED_MESSAGE = 'Inloggen op Magister is afgebroken. Klik opnieuw op het extensie-icoon.';

export function useStudentsInit(
	session: MagisterSessionStatus,
	fetchStudentsPaginated: () => Promise<void>,
	fetchLockers: () => Promise<void>,
	setLoading: (loading: boolean) => void,
	setError: (error: string | null) => void,
) {
	useEffect(() => {
		let cancelled = false;

		async function init() {
			setLoading(true);
			await loadStudentDataFromSession();

			if (session !== 'ready') {
				if (session === 'connecting') {
					setError(null);
				} else if (session === 'cancelled') {
					setError(LOGIN_CANCELLED_MESSAGE);
					setLoading(false);
				}
				return;
			}

			setError(null);
			await fetchStudentsPaginated().catch((err) => setError(err instanceof Error ? err.message : String(err)));
			if (cancelled) return;
			await fetchLockers().catch((err) => setError(err instanceof Error ? err.message : String(err)));
			if (cancelled) return;
			setLoading(false);
		}

		void init();
		return () => {
			cancelled = true;
		};
	}, [session, fetchStudentsPaginated, fetchLockers, setLoading, setError]);
}
