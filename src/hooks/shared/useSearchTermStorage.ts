import { useEffect, useState } from 'react';

function applyStoredSearchValue(stored: string | null | undefined, onSearchTermChange: (value: string) => void) {
	if (stored === undefined) return;
	if (stored === null) return;
	onSearchTermChange(stored);
}

async function readStoredSearchTerm(
	searchStorageKey: string,
	cancelled: () => boolean,
	onSearchTermChange: (value: string) => void,
	setSearchStorageReady: (value: boolean) => void,
) {
	const { storage } = await import('@/lib/shared/storage');
	const stored = await storage.session.get<string>(searchStorageKey);
	if (cancelled()) return;
	applyStoredSearchValue(stored, onSearchTermChange);
	setSearchStorageReady(true);
}

async function writeStoredSearchTerm(searchStorageKey: string, searchTerm: string) {
	const { storage } = await import('@/lib/shared/storage');
	await storage.session.set(searchStorageKey, searchTerm);
}

export function useSearchTermStorage(
	searchTerm: string,
	searchStorageKey: string | undefined,
	onSearchTermChange: (value: string) => void,
) {
	const [searchStorageReady, setSearchStorageReady] = useState(!searchStorageKey);

	useEffect(() => {
		if (!searchStorageKey) return;
		let cancelled = false;
		void readStoredSearchTerm(searchStorageKey, () => cancelled, onSearchTermChange, setSearchStorageReady);
		return () => {
			cancelled = true;
		};
	}, [searchStorageKey, onSearchTermChange]);

	useEffect(() => {
		if (!searchStorageKey) return;
		if (!searchStorageReady) return;
		void writeStoredSearchTerm(searchStorageKey, searchTerm);
	}, [searchTerm, searchStorageKey, searchStorageReady]);

	return searchStorageReady;
}
