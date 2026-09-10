import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useStudentsContext } from '@/context/StudentsContext';
import { useBulkList } from '@/hooks/useBulkLists';
import { countOpenReturnMeasuresToday } from '@/lib/returnMeasureOverview';
import { createStudentVisibility } from '@/lib/studentVisibility';
import type { ReturnMeasureStudent } from '@/magister/response/return-measure.types';
import { ReturnMeasuresContext, type ReturnMeasuresState } from './ReturnMeasuresContext';

export function ReturnMeasuresProvider({ children }: { children: ReactNode }) {
	const { students, selectedStudies } = useStudentsContext();
	const { data, loading, refreshing, error, refresh } = useBulkList<ReturnMeasureStudent[]>('return-measures');

	const openTodayCount = useMemo(() => {
		if (!data) return 0;
		const studentById = new Map(students.map((s) => [s.id, s]));
		return countOpenReturnMeasuresToday(data, createStudentVisibility(studentById, selectedStudies));
	}, [data, students, selectedStudies]);

	const state: ReturnMeasuresState = useMemo(
		() => ({
			data,
			loading,
			refreshing,
			error,
			openTodayCount,
			refresh,
		}),
		[data, loading, refreshing, error, openTodayCount, refresh],
	);

	return <ReturnMeasuresContext.Provider value={state}>{children}</ReturnMeasuresContext.Provider>;
}
