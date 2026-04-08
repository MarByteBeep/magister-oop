import { timeTable } from '@/lib/agendaUtils';
import { formatTime } from '@/lib/dateUtils';
import { formatLocation } from '@/lib/locationUtils';
import type { Student } from '@/magister/types';

/**
 * Calculates the occupancy for each location per lesson hour for a given day.
 * @param students An array of student objects, each potentially containing agenda data.
 * @param dateKey The date in 'YYYY-MM-DD' format for which to calculate occupancy.
 * @returns A nested object where the first key is the location, the second key is the lesson range (e.g., '08:30-09:10'), and the value is the count of students.
 */
export function getOccupancyForDay(students: Student[], dateKey: string): Record<string, Record<string, number>> {
	const occupancy: Record<string, Record<string, number>> = {};

	for (const student of students) {
		const agendaForDay = student.agenda?.[dateKey];

		if (agendaForDay) {
			for (const item of agendaForDay) {
				const beginTime = formatTime(new Date(item.begin));
				const endDate = new Date(item.einde);
				endDate.setMinutes(endDate.getMinutes() - 1);
				const endTime = formatTime(endDate);

				// find hours in which this item falls
				let begin = timeTable.findIndex((e) => beginTime >= e.begin && beginTime < e.einde);
				let end = timeTable.findIndex((e) => endTime >= e.begin && endTime < e.einde);

				// check for pauze
				if (begin < 0) begin = end;
				if (end < 0) end = begin;

				if (end >= 0 && begin >= 0) {
					for (let i = begin; i <= end; ++i) {
						const lessonRange = `${timeTable[i].begin}-${timeTable[i].einde}`;
						for (const location of item.locaties) {
							const locationCode = formatLocation(location);
							if (locationCode) {
								if (!occupancy[locationCode]) {
									occupancy[locationCode] = {};
								}
								if (!occupancy[locationCode][lessonRange]) {
									occupancy[locationCode][lessonRange] = 0;
								}
								occupancy[locationCode][lessonRange]++;
							}
						}
					}
				}
			}
		}
	}

	// Ensure all lesson ranges are present for each location, even if 0 students
	for (const location in occupancy) {
		for (const slot of timeTable) {
			const lessonRange = `${slot.begin}-${slot.einde}`;
			if (!occupancy[location][lessonRange]) {
				occupancy[location][lessonRange] = 0;
			}
		}
		// Sort lesson ranges for consistent display
		const sortedLessonRanges = Object.keys(occupancy[location]).sort((a, b) => {
			const [aStart] = a.split('-');
			const [bStart] = b.split('-');
			return aStart.localeCompare(bStart);
		});
		const sortedOccupancyForLocation: Record<string, number> = {};
		for (const range of sortedLessonRanges) {
			sortedOccupancyForLocation[range] = occupancy[location][range];
		}
		occupancy[location] = sortedOccupancyForLocation;
	}

	return occupancy;
}
