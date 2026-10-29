import type { Dispatch, SetStateAction } from 'react';
import { getMonthKey, getNow, parseDateKey } from '@/lib/shared/dateUtils';
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

/**
 * The snapshot always describes today's list, so a refresh for another month (e.g. the far end of a
 * return measure span) may update students but must not replace the published payload.
 */
function isSnapshotMonth(dateKey: string): boolean {
	return getMonthKey(parseDateKey(dateKey)) === getMonthKey(getNow());
}

function loadingPatchForMode(mode: BulkListMode): Partial<BulkListSnapshot> {
	if (mode === 'initial') return { loading: true, error: null };
	return { refreshing: true };
}

function nullResultError(mode: BulkListMode, previousError: string | null): string | null {
	if (mode === 'initial') return 'Kon de lijst niet ophalen.';
	return previousError;
}

function catchErrorMessage(mode: BulkListMode, error: unknown, previousError: string | null): string | null {
	if (mode === 'initial') return (error as Error).message;
	return previousError;
}

function settledSuccessPatch(dateKey: string, data: unknown): Partial<BulkListSnapshot> {
	const settled: Partial<BulkListSnapshot> = {
		loading: false,
		refreshing: false,
		error: null,
	};
	if (isSnapshotMonth(dateKey)) return { ...settled, data };
	return settled;
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

	function applyFetchedWithSource(source: BulkListSource, data: unknown, dateKey: string) {
		const apply = source.applyToStudents;
		if (!apply) return;
		if (!setStudents) return;
		setStudents((prev) => apply(prev, data, dateKey));
	}

	function applyFetched(id: string, data: unknown, dateKey: string) {
		const source = byId.get(id);
		if (!source) return;
		applyFetchedWithSource(source, data, dateKey);
	}

	function promotePendingToInitial(id: string, key: string) {
		inflightMode.set(key, 'initial');
		patch(id, { loading: true, refreshing: false, error: null });
	}

	function maybePromotePending(id: string, key: string, mode: BulkListMode, pending: Promise<unknown | null>) {
		if (mode === 'initial' && inflightMode.get(key) === 'background') {
			promotePendingToInitial(id, key);
		}
		return pending;
	}

	function previousError(id: string): string | null {
		const snapshot = snapshotFor(id);
		if (!snapshot) return null;
		return snapshot.error;
	}

	function patchNullFetch(id: string, mode: BulkListMode) {
		patch(id, {
			loading: false,
			refreshing: false,
			error: nullResultError(mode, previousError(id)),
		});
	}

	function patchFetchError(id: string, mode: BulkListMode, error: unknown) {
		console.warn(`Failed to refresh bulk list ${id}`, error);
		patch(id, {
			loading: false,
			refreshing: false,
			error: catchErrorMessage(mode, error, previousError(id)),
		});
	}

	async function fetchAndApply(
		id: string,
		dateKey: string,
		getMode: () => BulkListMode,
		source: BulkListSource,
	): Promise<unknown | null> {
		const data = await source.fetch(dateKey);
		const mode = getMode();
		if (data === null) {
			patchNullFetch(id, mode);
			return null;
		}
		patch(id, settledSuccessPatch(dateKey, data));
		applyFetched(id, data, dateKey);
		return data;
	}

	async function runFetchRequest(
		id: string,
		dateKey: string,
		mode: BulkListMode,
		key: string,
		source: BulkListSource,
	): Promise<unknown | null> {
		const activeMode = () => inflightMode.get(key) ?? mode;
		patch(id, loadingPatchForMode(activeMode()));
		try {
			return await fetchAndApply(id, dateKey, activeMode, source);
		} catch (error) {
			patchFetchError(id, activeMode(), error);
			return null;
		}
	}

	async function refresh(id: string, dateKey: string, mode: BulkListMode): Promise<unknown | null> {
		const source = byId.get(id);
		if (!source) throw new Error(`Unknown bulk list: ${id}`);

		const key = `${id}:${dateKey}`;
		const pending = inflight.get(key);
		if (pending) return maybePromotePending(id, key, mode, pending);

		inflightMode.set(key, mode);
		const request = runFetchRequest(id, dateKey, mode, key, source).finally(() => {
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
			if (current === undefined) {
				throw new Error(`Bulk list "${id}" does not publish a snapshot`);
			}
			let set = listeners.get(id);
			if (!set) {
				set = new Set();
				listeners.set(id, set);
			}
			set.add(listener);
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
