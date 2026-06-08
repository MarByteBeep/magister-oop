import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStudentsContext } from '@/context/StudentsContext';
import { useAllowedStudentIds } from '@/hooks/useAllowedStudentIds';
import { countAbsentForAllowedStudents } from '@/lib/absenceUtils';
import { getTodayKey } from '@/lib/dateUtils';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { UnauthorizedAbsencesResponse } from '@/magister/response/unauthorized-absence.types';
import { AbsencesContext, type AbsencesState } from './AbsencesContext';

export function AbsencesProvider({ children }: { children: ReactNode }) {
	const { students, selectedStudies } = useStudentsContext();
	const [data, setData] = useState<UnauthorizedAbsencesResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const todayKey = getTodayKey();

	// Initial load (shows loading spinner)
	const initialFetch = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const url = endpoints.unauthorizedAbsences(todayKey);
			const res = await getJson<UnauthorizedAbsencesResponse>(url, 'include', 'no-cache');
			setData(res);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, [todayKey]);

	// Background refresh (subtle, doesn't replace UI)
	const backgroundRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			const url = endpoints.unauthorizedAbsences(todayKey);
			const res = await getJson<UnauthorizedAbsencesResponse>(url, 'include', 'no-cache');
			setData(res);
			setError(null);
		} catch (e) {
			// Don't show error on background refresh, just log it
			console.error('Background refresh failed:', e);
		} finally {
			setRefreshing(false);
		}
	}, [todayKey]);

	// Manual refresh (user-initiated, shows refreshing indicator)
	const refresh = useCallback(async () => {
		if (data) {
			// If we have data, do a background refresh
			await backgroundRefresh();
		} else {
			// If no data yet, do initial fetch
			await initialFetch();
		}
	}, [data, backgroundRefresh, initialFetch]);

	// Initial load
	useEffect(() => {
		void initialFetch();
	}, [initialFetch]);

	// Auto-refresh every minute (background)
	useEffect(() => {
		const interval = setInterval(() => {
			void backgroundRefresh();
		}, 60000);
		return () => clearInterval(interval);
	}, [backgroundRefresh]);

	const allowedStudentIds = useAllowedStudentIds(students, selectedStudies);

	const absentCount = useMemo(
		() => (data ? countAbsentForAllowedStudents(data, allowedStudentIds) : 0),
		[data, allowedStudentIds],
	);

	const state: AbsencesState = useMemo(
		() => ({
			data,
			loading,
			refreshing,
			error,
			absentCount,
			refresh,
		}),
		[data, loading, refreshing, error, absentCount, refresh],
	);

	return <AbsencesContext.Provider value={state}>{children}</AbsencesContext.Provider>;
}
