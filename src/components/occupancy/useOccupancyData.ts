import { useMemo } from 'react';
import { getTodayKey } from '@/lib/dateUtils';
import { getOccupancyForDay } from '@/lib/occupancyUtils';
import type { Student } from '@/magister/types';

export function useOccupancyData(students: Student[]) {
	const todayKey = getTodayKey();
	const occupancyData = useMemo(() => getOccupancyForDay(students, todayKey), [students, todayKey]);
	const allLocations = useMemo(() => Object.keys(occupancyData).sort(), [occupancyData]);
	const hasData = Boolean(occupancyData && Object.keys(occupancyData).length > 0);

	return { todayKey, occupancyData, allLocations, hasData };
}
