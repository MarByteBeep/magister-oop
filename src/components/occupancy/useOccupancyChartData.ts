import { useMemo } from 'react';
import { countStudentsForLessonRange, type OccupancyChartPoint } from '@/lib/occupancyUtils';
import type { Student } from '@/magister/types';

export type { OccupancyChartPoint };

export function useOccupancyChartData(
	filteredLocations: string[],
	occupancyData: Record<string, Record<string, number>>,
	students: Student[],
	todayKey: string,
	allLocations: string[],
) {
	return useMemo(() => {
		if (filteredLocations.length === 0) return [];

		const lessonRanges = Object.keys(occupancyData[filteredLocations[0]] ?? {});

		return lessonRanges.map((lessonRange) => ({
			lessonRange,
			...countStudentsForLessonRange(lessonRange, students, todayKey, allLocations),
		}));
	}, [filteredLocations, occupancyData, students, todayKey, allLocations]);
}
