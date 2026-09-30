import { useMemo } from 'react';
import { getOccupancyForDay } from '@/lib/occupancy/utils';
import { getTodayKey } from '@/lib/shared/dateUtils';
import type { Student } from '@/types/student.types';

export function useOccupancyData(students: Student[]) {
	const todayKey = getTodayKey();
	const occupancyData = useMemo(() => getOccupancyForDay(students, todayKey), [students, todayKey]);
	const allLocations = useMemo(() => Object.keys(occupancyData).sort(), [occupancyData]);
	const hasData = Boolean(occupancyData && Object.keys(occupancyData).length > 0);

	return { todayKey, occupancyData, allLocations, hasData };
}
