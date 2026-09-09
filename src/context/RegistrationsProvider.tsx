import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useStudentsContext } from '@/context/StudentsContext';
import { useBulkList } from '@/hooks/useBulkLists';
import { countAbsentRegistrations, createRegistrationVisibility } from '@/lib/registrationsUtils';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';
import { RegistrationsContext, type RegistrationsState } from './RegistrationsContext';

export function RegistrationsProvider({ children }: { children: ReactNode }) {
	const { students, selectedStudies } = useStudentsContext();
	const { data, loading, refreshing, error, refresh } = useBulkList<RegistrationsResponse>('registrations');

	const registrationCount = useMemo(() => {
		if (!data) return 0;
		const studentById = new Map(students.map((s) => [s.id, s]));
		return countAbsentRegistrations(data, createRegistrationVisibility(studentById, selectedStudies));
	}, [data, students, selectedStudies]);

	const state: RegistrationsState = useMemo(
		() => ({
			data,
			loading,
			refreshing,
			error,
			registrationCount,
			refresh,
		}),
		[data, loading, refreshing, error, registrationCount, refresh],
	);

	return <RegistrationsContext.Provider value={state}>{children}</RegistrationsContext.Provider>;
}
