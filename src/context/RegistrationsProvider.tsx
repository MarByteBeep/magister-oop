import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useStudentsContext } from '@/context/StudentsContext';
import { useAllowedStudentIds } from '@/hooks/useAllowedStudentIds';
import { useBulkList } from '@/hooks/useBulkLists';
import { countRegistrationsForAllowedStudents } from '@/lib/registrationsUtils';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';
import { RegistrationsContext, type RegistrationsState } from './RegistrationsContext';

export function RegistrationsProvider({ children }: { children: ReactNode }) {
	const { students, selectedStudies } = useStudentsContext();
	const { data, loading, refreshing, error, refresh } = useBulkList<RegistrationsResponse>('registrations');
	const allowedStudentIds = useAllowedStudentIds(students, selectedStudies);

	const registrationCount = useMemo(
		() => (data ? countRegistrationsForAllowedStudents(data, allowedStudentIds) : 0),
		[data, allowedStudentIds],
	);

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
