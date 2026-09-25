import type { Dispatch, SetStateAction } from 'react';
import type { Student } from '@/types/student.types';
import type { StudentWrite } from '@/types/studentStore.types';

export type BulkListMode = 'initial' | 'background';

export type BulkListSnapshot<T = unknown> = {
	data: T | null;
	loading: boolean;
	refreshing: boolean;
	error: string | null;
};

export type BulkListSource<T = unknown> = {
	id: string;
	fetch: (dateKey: string) => Promise<T | null>;
	applyToStudents?: (students: Student[], data: T, dateKey: string) => StudentWrite[];
	/** When false, refresh still runs and may apply to students, but snapshot()/subscribe are unavailable. */
	publishSnapshot?: boolean;
};

/** Erases the payload type so mixed sources can live in one registry. */
export function defineBulkList<T>(source: BulkListSource<T>): BulkListSource {
	return {
		id: source.id,
		fetch: source.fetch,
		publishSnapshot: source.publishSnapshot,
		applyToStudents: source.applyToStudents
			? (students, data, dateKey) => source.applyToStudents?.(students, data as T, dateKey) ?? students
			: undefined,
	};
}

export function emptyBulkListSnapshot<T = unknown>(): BulkListSnapshot<T> {
	return { data: null, loading: true, refreshing: false, error: null };
}

export function createBulkListRegistry(sources: BulkListSource[]) {
	const byId = new Map(sources.map((source) => [source.id, source]));
	const snapshots = new Map<string, BulkListSnapshot>(
		sources
			.filter((source) => source.publishSnapshot !== false)
			.map((source) => [source.id, emptyBulkListSnapshot()]),
	);
	const listeners = new Map<string, Set<(snapshot: BulkListSnapshot) => void>>();
	const inflight = new Map<string, Promise<unknown | null>>();
	const inflightMode = new Map<string, BulkListMode>();
	let setStudents: Dispatch<SetStateAction<StudentWrite[]>> | null = null;

	function snapshotFor(id: string): BulkListSnapshot | null {
		return snapshots.get(id) ?? null;
	}

	function publish(id: string, next: BulkListSnapshot) {
		snapshots.set(id, next);
		for (const listener of listeners.get(id) ?? []) listener(next);
	}

	function patch(id: string, partial: Partial<BulkListSnapshot>) {
		const current = snapshots.get(id);
		if (!current) return;
		publish(id, { ...current, ...partial });
	}

	function applyFetched(id: string, data: unknown, dateKey: string) {
		const source = byId.get(id);
		if (!source?.applyToStudents || !setStudents) return;
		setStudents((prev) => source.applyToStudents?.(prev, data, dateKey) ?? prev);
	}

	async function refresh(id: string, dateKey: string, mode: BulkListMode): Promise<unknown | null> {
		const source = byId.get(id);
		if (!source) throw new Error(`Unknown bulk list: ${id}`);

		const key = `${id}:${dateKey}`;
		const pending = inflight.get(key);
		if (pending) {
			// Promote background → initial so "Opnieuw proberen" keeps initial error semantics.
			if (mode === 'initial' && inflightMode.get(key) === 'background') {
				inflightMode.set(key, 'initial');
				patch(id, { loading: true, refreshing: false, error: null });
			}
			return pending;
		}

		inflightMode.set(key, mode);
		const request = (async () => {
			const activeMode = () => inflightMode.get(key) ?? mode;
			patch(id, activeMode() === 'initial' ? { loading: true, error: null } : { refreshing: true });
			try {
				const data = await source.fetch(dateKey);
				if (data == null) {
					patch(id, {
						loading: false,
						refreshing: false,
						error:
							activeMode() === 'initial'
								? 'Kon de lijst niet ophalen.'
								: (snapshotFor(id)?.error ?? null),
					});
					return null;
				}
				patch(id, { data, loading: false, refreshing: false, error: null });
				applyFetched(id, data, dateKey);
				return data;
			} catch (error) {
				console.warn(`Failed to refresh bulk list ${id}`, error);
				patch(id, {
					loading: false,
					refreshing: false,
					error: activeMode() === 'initial' ? (error as Error).message : (snapshotFor(id)?.error ?? null),
				});
				return null;
			}
		})().finally(() => {
			inflight.delete(key);
			inflightMode.delete(key);
		});

		inflight.set(key, request);
		return request;
	}

	return {
		sources,
		snapshot: snapshotFor,
		subscribe(id: string, listener: (snapshot: BulkListSnapshot) => void) {
			const current = snapshots.get(id);
			if (current == null) {
				throw new Error(`Bulk list "${id}" does not publish a snapshot`);
			}
			const set = listeners.get(id) ?? new Set();
			set.add(listener);
			listeners.set(id, set);
			listener(current);
			return () => {
				set.delete(listener);
			};
		},
		attachStudentUpdater(updater: Dispatch<SetStateAction<StudentWrite[]>>) {
			setStudents = updater;
			return () => {
				if (setStudents === updater) setStudents = null;
			};
		},
		refresh,
		async refreshAll(dateKey: string, mode: BulkListMode) {
			await Promise.all(sources.map((source) => refresh(source.id, dateKey, mode)));
		},
	};
}
