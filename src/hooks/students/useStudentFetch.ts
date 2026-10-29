import { type Dispatch, type SetStateAction, useCallback } from 'react';
import { clearStudentStore } from '@/hooks/students/useStudentStore';
import { ensureAttendanceTypes } from '@/lib/absence-notice/attendanceTypes';
import { mergeDeep } from '@/lib/shared/objectUtils';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { LockersResponse } from '@/magister/response/locker.types';
import type { StudentsResponse } from '@/magister/response/student.types';
import type { Student } from '@/types/student.types';

function mergeStudentIntoList(merged: Student[], student: Student): void {
	const idx = merged.findIndex((st) => st.id === student.id);
	if (idx >= 0) {
		merged[idx] = mergeDeep(merged[idx], student);
		return;
	}
	merged.push(student);
}

function mergeStudentPage(prev: Student[], items: Student[]): Student[] {
	const merged = [...prev];
	for (const student of items) {
		mergeStudentIntoList(merged, student);
	}
	return merged;
}

function firstStudentUuid(items: StudentsResponse['items']): string | null {
	const externeId = items[0]?.externeId;
	if (!externeId) return null;
	return externeId;
}

async function ensureAttendanceTypesForUuid(studentUuid: string | null): Promise<void> {
	if (!studentUuid) return;
	await ensureAttendanceTypes(studentUuid).catch((error) => {
		console.error('Failed to load attendance types', error);
	});
}

function nextPageUrl(data: StudentsResponse): string | null {
	return data.links.next?.href ?? null;
}

function rememberFirstUuid(current: string | null, items: StudentsResponse['items']): string | null {
	if (current) return current;
	return firstStudentUuid(items);
}

async function fetchStudentPage(
	url: string,
	setStudents: Dispatch<SetStateAction<Student[]>>,
	firstUuid: string | null,
): Promise<{ nextUrl: string | null; firstUuid: string | null }> {
	const data: StudentsResponse = await getJson<StudentsResponse>(url, 'include', 'no-cache');
	setStudents((prev) => mergeStudentPage(prev, data.items));
	return {
		nextUrl: nextPageUrl(data),
		firstUuid: rememberFirstUuid(firstUuid, data.items),
	};
}

async function fetchAllStudentPages(setStudents: Dispatch<SetStateAction<Student[]>>): Promise<string | null> {
	let nextUrl: string | null = endpoints.searchStudents(50, 0);
	let firstUuid: string | null = null;

	while (nextUrl) {
		const page = await fetchStudentPage(nextUrl, setStudents, firstUuid);
		nextUrl = page.nextUrl;
		firstUuid = page.firstUuid;
	}

	return firstUuid;
}

export function useStudentFetch(setStudents: Dispatch<SetStateAction<Student[]>>) {
	const fetchLockers = useCallback(async () => {
		try {
			const data: LockersResponse = await getJson<LockersResponse>(endpoints.lockers(), 'omit');
			setStudents((prev) =>
				prev.map((s) => {
					const locker = data.lockersDetails.find((l) => l.rentalPeriod?.student?.personId === s.id);
					if (!locker) return s;
					return mergeDeep(s, { lockerCode: locker.lockerCode });
				}),
			);
		} catch (e) {
			console.error(e);
		}
	}, [setStudents]);

	const fetchStudentsPaginated = useCallback(async () => {
		const firstUuid = await fetchAllStudentPages(setStudents);
		await ensureAttendanceTypesForUuid(firstUuid);
	}, [setStudents]);

	const refresh = useCallback(async () => {
		await clearStudentStore();
		await Promise.all([fetchStudentsPaginated(), fetchLockers()]);
	}, [fetchStudentsPaginated, fetchLockers]);

	return { fetchLockers, fetchStudentsPaginated, refresh };
}
