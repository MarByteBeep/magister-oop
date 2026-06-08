import mergeOriginal, { type Options } from 'deepmerge';
import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef } from 'react';
import { storage, syncFromChrome } from '@/lib/storage';
import { deepEqual } from '@/lib/utils';
import type { Student } from '@/magister/types';

const studentsStorageKey = 'students';

export function mergeStudent<T>(target: T, source: Partial<T>, options?: Options): T {
	return mergeOriginal(target, source, { arrayMerge: (_, sourceArray) => sourceArray, ...options });
}

export function useStudentStorageSync(students: Student[], setStudents: Dispatch<SetStateAction<Student[]>>) {
	const isWritingStudentsToStorage = useRef(false);

	const loadStoredStudents = useCallback(async () => {
		const arr = await storage.session.get<Student[]>(studentsStorageKey);
		return arr ?? [];
	}, []);

	useEffect(() => {
		if (students.length) {
			isWritingStudentsToStorage.current = true;
			void storage.session.set(studentsStorageKey, students).then(() => {
				setTimeout(() => {
					isWritingStudentsToStorage.current = false;
				}, 50);
			});
		}
	}, [students]);

	useEffect(() => {
		if (!chrome?.storage) return;

		const onSessionStudents = syncFromChrome<Student[]>('session', studentsStorageKey, (arr) => {
			if (isWritingStudentsToStorage.current) return;
			setStudents((prev) => {
				const updated = arr ?? [];
				return deepEqual(prev, updated) ? prev : updated;
			});
		});

		chrome.storage.onChanged.addListener(onSessionStudents);
		return () => chrome.storage.onChanged.removeListener(onSessionStudents);
	}, [setStudents]);

	return { loadStoredStudents };
}
