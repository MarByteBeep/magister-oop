import { useEffect, useMemo, useRef, useState } from 'react';
import { storage } from '@/lib/storage';

const OCCUPANCY_LOCATIONS_STORAGE_KEY = 'occupancySelectedLocations';

export function useOccupancyLocationSelection(allLocations: string[]) {
	const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
	const [initializedLocations, setInitializedLocations] = useState(false);
	const hasInitialLoadFromStorage = useRef(false);

	useEffect(() => {
		if (hasInitialLoadFromStorage.current || allLocations.length === 0) return;

		(async () => {
			const stored = await storage.local.get<string[]>(OCCUPANCY_LOCATIONS_STORAGE_KEY);
			const initialSelection = stored !== undefined && stored !== null ? new Set(stored) : new Set(allLocations);

			setSelectedLocations(initialSelection);
			setInitializedLocations(true);
			hasInitialLoadFromStorage.current = true;
		})();
	}, [allLocations]);

	useEffect(() => {
		if (!initializedLocations) return;
		void storage.local.set(OCCUPANCY_LOCATIONS_STORAGE_KEY, Array.from(selectedLocations));
	}, [selectedLocations, initializedLocations]);

	const filteredLocations = useMemo(() => {
		if (!initializedLocations) return allLocations;
		return allLocations.filter((location) => selectedLocations.has(location));
	}, [allLocations, selectedLocations, initializedLocations]);

	const handleLocationFilterChange = (location: string, checked: boolean) => {
		setSelectedLocations((prev) => {
			const newSet = new Set(prev);
			checked ? newSet.add(location) : newSet.delete(location);
			return newSet;
		});
	};

	return {
		selectedLocations,
		filteredLocations,
		handleLocationFilterChange,
		handleSelectAll: () => setSelectedLocations(new Set(allLocations)),
		handleDeselectAll: () => setSelectedLocations(new Set()),
	};
}
