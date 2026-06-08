import { useEffect, useState } from 'react';

export function useSearchTermStorage(
	searchTerm: string,
	searchStorageKey: string | undefined,
	onSearchTermChange: (value: string) => void,
) {
	const [searchStorageReady, setSearchStorageReady] = useState(!searchStorageKey);

	useEffect(() => {
		if (!searchStorageKey) return;
		let cancelled = false;
		(async () => {
			const { storage } = await import('@/lib/storage');
			const stored = await storage.session.get<string>(searchStorageKey);
			if (!cancelled && stored != null) onSearchTermChange(stored);
			if (!cancelled) setSearchStorageReady(true);
		})();
		return () => {
			cancelled = true;
		};
	}, [searchStorageKey, onSearchTermChange]);

	useEffect(() => {
		if (!searchStorageKey || !searchStorageReady) return;
		(async () => {
			const { storage } = await import('@/lib/storage');
			await storage.session.set(searchStorageKey, searchTerm);
		})();
	}, [searchTerm, searchStorageKey, searchStorageReady]);

	return searchStorageReady;
}
