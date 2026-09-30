import { type Dispatch, type SetStateAction, useCallback } from 'react';
import { clearStudentStore } from '@/hooks/students/useStudentStore';
import { ensureAttendanceTypes } from '@/lib/absence-notice/attendanceTypes';
import { mergeStudent } from '@/lib/students/mergeStudent';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { LockersResponse } from '@/magister/response/locker.types';
import type { StudentsResponse } from '@/magister/response/student.types';
import type { Student } from '@/types/student.types';

export function useStudentFetch(setStudents: Dispatch<SetStateAction<Student[]>>) {
	const fetchLockers = useCallback(async () => {
		try {
			const data: LockersResponse = await getJson<LockersResponse>(endpoints.lockers(), 'omit');
			setStudents((prev) =>
				prev.map((s) => {
					const locker = data.lockersDetails.find((l) => l.rentalPeriod?.student?.personId === s.id);
					return locker ? mergeStudent(s, { lockerCode: locker.lockerCode }) : s;
				}),
			);
		} catch (e) {
			console.error(e);
		}
	}, [setStudents]);

	const fetchStudentsPaginated = useCallback(async () => {
		let nextUrl: string | null = endpoints.searchStudents(50, 0);
		let firstStudentUuid: string | null = null;

		while (nextUrl) {
			const data: StudentsResponse = await getJson<StudentsResponse>(nextUrl, 'include', 'no-cache');
			if (!firstStudentUuid && data.items[0]?.externeId) {
				firstStudentUuid = data.items[0].externeId;
			}
			setStudents((prev) => {
				const merged = [...prev];
				for (const s of data.items) {
					const idx = merged.findIndex((st) => st.id === s.id);
					if (idx >= 0) merged[idx] = mergeStudent(merged[idx], s);
					else merged.push(s);
				}
				return merged;
			});
			nextUrl = data.links.next?.href ?? null;
		}

		if (firstStudentUuid) {
			await ensureAttendanceTypes(firstStudentUuid).catch((error) => {
				console.error('Failed to load attendance types', error);
			});
		}
	}, [setStudents]);

	const refresh = useCallback(async () => {
		await clearStudentStore();
		await Promise.all([fetchStudentsPaginated(), fetchLockers()]);
	}, [fetchStudentsPaginated, fetchLockers]);

	return { fetchLockers, fetchStudentsPaginated, refresh };
}
