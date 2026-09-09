import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from 'react';
import type { BulkListMode, BulkListSnapshot } from '@/lib/bulkListRegistry';
import { bulkListRegistry } from '@/lib/bulkListSources';
import { getTodayKey } from '@/lib/dateUtils';
import type { Student } from '@/magister/types';

const REFRESH_INTERVAL_MS = 60_000;

/** Shared mount + interval refresh for all bulk lists (absence notices, registrations, …). */
export function useBulkLists(setStudents: Dispatch<SetStateAction<Student[]>>) {
	const refreshAll = useCallback(async (mode: BulkListMode) => {
		await bulkListRegistry.refreshAll(getTodayKey(), mode);
	}, []);

	useEffect(() => bulkListRegistry.attachStudentUpdater(setStudents), [setStudents]);

	useEffect(() => {
		void refreshAll('initial');
	}, [refreshAll]);

	useEffect(() => {
		const interval = setInterval(() => {
			void refreshAll('background');
		}, REFRESH_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [refreshAll]);
}

/** Subscribe to one snapshot-publishing bulk list (e.g. registrations). */
export function useBulkList<T>(id: string) {
	const [snapshot, setSnapshot] = useState<BulkListSnapshot<T>>(() => {
		const initial = bulkListRegistry.snapshot(id);
		if (initial == null) throw new Error(`Bulk list "${id}" does not publish a snapshot`);
		return initial as BulkListSnapshot<T>;
	});

	useEffect(() => bulkListRegistry.subscribe(id, (next) => setSnapshot(next as BulkListSnapshot<T>)), [id]);

	const refresh = useCallback(async () => {
		const mode: BulkListMode = snapshot.data != null ? 'background' : 'initial';
		await bulkListRegistry.refresh(id, getTodayKey(), mode);
	}, [id, snapshot.data]);

	return {
		data: snapshot.data,
		loading: snapshot.loading,
		refreshing: snapshot.refreshing,
		error: snapshot.error,
		refresh,
	};
}
