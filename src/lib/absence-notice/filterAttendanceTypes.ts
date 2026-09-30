import type { AttendanceType } from '@/magister/response/attendanceType.types';

/** Lower rank = higher priority. `null` = no match. */
function attendanceTypeMatchRank(type: AttendanceType, query: string): number | null {
	const code = type.code.toLowerCase();
	const description = type.description.toLowerCase();

	if (code === query) return 0;
	if (code.startsWith(query)) return 1;
	if (code.includes(query)) return 2;
	if (description.startsWith(query)) return 3;
	if (description.includes(query)) return 4;
	return null;
}

/** Filter attendance types; code matches rank above description matches. */
export function filterAttendanceTypes(types: AttendanceType[], query: string): AttendanceType[] {
	const normalized = query.trim().toLowerCase();
	if (!normalized) return types;

	return types
		.map((type, index) => {
			const rank = attendanceTypeMatchRank(type, normalized);
			return rank == null ? null : { type, index, rank };
		})
		.filter((entry): entry is { type: AttendanceType; index: number; rank: number } => entry != null)
		.sort((a, b) => a.rank - b.rank || a.index - b.index)
		.map((entry) => entry.type);
}
