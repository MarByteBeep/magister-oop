import { useEffect, useState } from 'react';
import { storage, syncFromChrome } from '@/lib/storage';

const selectedStudiesStorageKey = 'selectedStudies';

export function useSelectedStudiesStorage() {
	const [selectedStudies, setSelectedStudies] = useState<Set<string>>(new Set());
	const [initializedStudies, setInitializedStudies] = useState(false);

	useEffect(() => {
		(async () => {
			const arr = await storage.local.get<string[]>(selectedStudiesStorageKey);
			setSelectedStudies(new Set(arr ?? []));
			setInitializedStudies(true);
		})();
	}, []);

	useEffect(() => {
		if (!initializedStudies) return;
		void storage.local.set(selectedStudiesStorageKey, Array.from(selectedStudies));
	}, [selectedStudies, initializedStudies]);

	useEffect(() => {
		if (!chrome?.storage) return;

		const onLocalSelectedStudies = syncFromChrome<string[]>('local', selectedStudiesStorageKey, (arr) =>
			setSelectedStudies(new Set(arr)),
		);

		chrome.storage.onChanged.addListener(onLocalSelectedStudies);
		return () => chrome.storage.onChanged.removeListener(onLocalSelectedStudies);
	}, []);

	return { selectedStudies, setSelectedStudies, initializedStudies };
}
