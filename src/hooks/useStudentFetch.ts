import { type Dispatch, type SetStateAction, useCallback } from 'react';
import { clearStudentStore } from '@/hooks/useStudentStore';
import { mergeStudent } from '@/lib/mergeStudent';
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

		while (nextUrl) {
			const data: StudentsResponse = await getJson<StudentsResponse>(nextUrl, 'include', 'no-cache');
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
	}, [setStudents]);

	const refresh = useCallback(async () => {
		await clearStudentStore();
		await Promise.all([fetchStudentsPaginated(), fetchLockers()]);
	}, [fetchStudentsPaginated, fetchLockers]);

	return { fetchLockers, fetchStudentsPaginated, refresh };
}
