import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { AttendanceType, AttendanceTypesResponse } from '@/magister/response/attendanceType.types';

let cache: AttendanceType[] | null = null;
let inflight: Promise<AttendanceType[]> | null = null;

export function getAttendanceTypes(): AttendanceType[] {
	return cache ?? [];
}

export function getAttendanceType(code: string): AttendanceType | undefined {
	return getAttendanceTypes().find((type) => type.code === code);
}

/** School-wide codes — fetch once using any student's UUID; identical for all students. */
export async function ensureAttendanceTypes(studentUuid: string): Promise<AttendanceType[]> {
	if (cache) return cache;
	if (inflight) return inflight;

	let request!: Promise<AttendanceType[]>;
	request = (async () => {
		try {
			const items = await getJson<AttendanceTypesResponse>(
				endpoints.attendanceTypes(studentUuid),
				'omit',
				'no-cache',
				'bearer',
			);
			cache = items;
			return items;
		} catch (error) {
			console.error('Failed to fetch attendance types', error);
			throw error;
		} finally {
			if (inflight === request) inflight = null;
		}
	})();

	inflight = request;
	return request;
}
